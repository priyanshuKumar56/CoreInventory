const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../config/db');
const { generateOTP, sendOTPEmail } = require('../utils/email');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// POST /api/auth/signup
// SECURITY: Role is ALWAYS forced to 'staff'. Only admins can promote users via a separate endpoint.
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const role = 'staff'; // Hardcoded — prevents privilege escalation

    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), hashedPassword, role]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token in DB
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    logger.info(`New user registered: ${email}`);
    await auditLog(req, 'user.signup', 'user', user.id, null, { name, email, role });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token & update last login
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    delete user.password;
    logger.info(`User logged in: ${email}`);
    await auditLog(req, 'user.login', 'user', user.id, null, { email });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
// SECURITY: Reads refresh token from HttpOnly cookie, NOT from request body
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = await query(
      'SELECT id, user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (!stored.rows.length) {
      // Token reuse detected — potential theft. Invalidate ALL tokens for this user.
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id]);
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ success: false, message: 'Token reuse detected. All sessions revoked.' });
    }

    const userRes = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    if (!userRes.rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Rotate tokens
    await query('DELETE FROM refresh_tokens WHERE id = $1', [stored.rows[0].id]);
    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(decoded.id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [decoded.id, newRefresh, expiresAt]
    );

    // Set new refresh token as HttpOnly cookie
    res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { accessToken: newAccess, user: userRes.rows[0] },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const userRes = await query('SELECT id, name FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    // Always respond OK to prevent email enumeration
    if (!userRes.rows.length) {
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000);

    // Invalidate old OTPs
    await query(
      "UPDATE otp_tokens SET used = true WHERE email = $1 AND purpose = 'password_reset' AND used = false",
      [email.toLowerCase()]
    );

    await query(
      'INSERT INTO otp_tokens (email, token, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase(), otp, 'password_reset', expiresAt]
    );

    await sendOTPEmail(email, otp, 'password_reset');

    res.json({ success: true, message: 'OTP sent to your email address.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await query(
      `SELECT id FROM otp_tokens
       WHERE email = $1 AND token = $2 AND purpose = 'password_reset'
       AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    res.json({ success: true, message: 'OTP verified', data: { verified: true } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRes = await query(
      `SELECT id FROM otp_tokens
       WHERE email = $1 AND token = $2 AND purpose = 'password_reset'
       AND used = false AND expires_at > NOW()`,
      [email.toLowerCase(), otp]
    );

    if (!otpRes.rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await withTransaction(async (client) => {
      await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email.toLowerCase()]);
      await client.query('UPDATE otp_tokens SET used = true WHERE id = $1', [otpRes.rows[0].id]);
      await client.query('DELETE FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE email = $1)', [email.toLowerCase()]);
    });

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};
