const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransport = () => {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    logger.warn('SMTP not configured. OTP will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'password_reset') => {
  logger.info(`OTP for ${email}: ${otp}`); // Always log for dev

  const transport = createTransport();
  if (!transport) return; // Dev mode without SMTP

  const subjects = {
    password_reset: 'CoreInventory - Password Reset OTP',
    email_verify: 'CoreInventory - Email Verification',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f7f8fa;">
      <div style="background: #0f1117; border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #4f8ef7; margin-bottom: 8px;">CI</div>
        <h2 style="color: #e8ecf0; font-size: 20px; margin: 0 0 24px;">CoreInventory</h2>
        <p style="color: #8a95a3; font-size: 15px; margin: 0 0 32px;">
          ${purpose === 'password_reset' ? 'Use this OTP to reset your password.' : 'Verify your email address.'}
        </p>
        <div style="background: #1e2535; border: 1px solid rgba(79,142,247,0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #4f8ef7; font-family: monospace;">${otp}</div>
        </div>
        <p style="color: #5a6478; font-size: 13px; margin: 0;">
          This OTP expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.<br>
          If you didn't request this, ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'CoreInventory <noreply@coreinventory.com>',
      to: email,
      subject: subjects[purpose] || subjects.password_reset,
      html,
    });
    logger.info(`OTP email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send OTP email:', err.message);
    throw new Error('Failed to send email. Please try again.', { cause: err });
  }
};

module.exports = { generateOTP, sendOTPEmail };
