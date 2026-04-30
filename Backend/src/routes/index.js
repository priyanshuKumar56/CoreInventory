const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const dashCtrl = require('../controllers/dashboardController');
const receiptCtrl = require('../controllers/receiptController');
const deliveryCtrl = require('../controllers/deliveryController');
const invCtrl = require('../controllers/inventoryController');

const router = express.Router();

// ── ROOT ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoreInventory API is live',
    version: '1.0.0',
    documentation: '/docs (pending)'
  });
});

// ── Validation helpers ────────────────────────────────────────────
const validate = (validations) => {
  return async (req, res, next) => {
    const { validationResult } = require('express-validator');
    await Promise.all(validations.map(v => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  };
};

// ── AUTH ROUTES ───────────────────────────────────────────────────
router.post('/auth/signup', validate([
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
]), authCtrl.signup);

router.post('/auth/login', validate([
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]), authCtrl.login);

router.post('/auth/refresh', authCtrl.refreshToken);
router.post('/auth/logout', authCtrl.logout);
router.post('/auth/forgot-password', validate([body('email').isEmail()]), authCtrl.forgotPassword);
router.post('/auth/verify-otp', validate([body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })]), authCtrl.verifyOTP);
router.post('/auth/reset-password', validate([
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 }),
]), authCtrl.resetPassword);

router.get('/auth/me', authenticate, authCtrl.getMe);

// ── DASHBOARD ─────────────────────────────────────────────────────
router.get('/dashboard', authenticate, dashCtrl.getDashboard);

// ── RECEIPTS ──────────────────────────────────────────────────────
router.get('/receipts', authenticate, receiptCtrl.getReceipts);
router.get('/receipts/:id', authenticate, receiptCtrl.getReceiptById);
router.post('/receipts', authenticate, validate([
  body('warehouse_id').isUUID(),
  body('items').optional().isArray(),
]), receiptCtrl.createReceipt);
router.put('/receipts/:id', authenticate, receiptCtrl.updateReceipt);

// Only admin/manager can validate or delete receipts
router.post('/receipts/:id/action', authenticate, (req, res, next) => {
  if (req.body.action === 'validate' || req.body.action === 'cancel') {
    return authorize('admin', 'manager')(req, res, next);
  }
  next();
}, validate([
  body('action').isIn(['confirm', 'validate', 'cancel']),
]), receiptCtrl.receiptAction);

router.delete('/receipts/:id', authenticate, authorize('admin', 'manager'), receiptCtrl.deleteReceipt);

// ── DELIVERIES ────────────────────────────────────────────────────
router.get('/deliveries', authenticate, deliveryCtrl.getDeliveries);
router.get('/deliveries/:id', authenticate, deliveryCtrl.getDeliveryById);
router.post('/deliveries', authenticate, deliveryCtrl.createDelivery);
router.put('/deliveries/:id', authenticate, deliveryCtrl.updateDelivery);

// Only admin/manager can validate deliveries
router.post('/deliveries/:id/action', authenticate, (req, res, next) => {
  if (req.body.action === 'validate' || req.body.action === 'cancel') {
    return authorize('admin', 'manager')(req, res, next);
  }
  next();
}, validate([
  body('action').isIn(['confirm', 'validate', 'cancel']),
]), deliveryCtrl.deliveryAction);

// ── TRANSFERS ─────────────────────────────────────────────────────
router.get('/transfers', authenticate, invCtrl.getTransfers);
router.get('/transfers/:id', authenticate, invCtrl.getTransferById);
router.post('/transfers', authenticate, invCtrl.createTransfer);

// Only admin/manager can validate transfers
router.post('/transfers/:id/action', authenticate, (req, res, next) => {
  if (req.body.action === 'validate') {
    return authorize('admin', 'manager')(req, res, next);
  }
  next();
}, invCtrl.transferAction);

// ── ADJUSTMENTS ───────────────────────────────────────────────────
router.get('/adjustments', authenticate, invCtrl.getAdjustments);
router.get('/adjustments/:id', authenticate, invCtrl.getAdjustmentById);
router.post('/adjustments', authenticate, invCtrl.createAdjustment);
router.post('/adjustments/:id/validate', authenticate, authorize('admin', 'manager'), invCtrl.validateAdjustment);

// ── STOCK & MOVES ─────────────────────────────────────────────────
router.get('/stock', authenticate, invCtrl.getStockOverview);
router.get('/moves', authenticate, invCtrl.getMoveHistory);

// ── PRODUCTS ──────────────────────────────────────────────────────
router.get('/products', authenticate, invCtrl.getProducts);
router.post('/products/export', authenticate, invCtrl.exportInventory);
router.post('/products/predict-restock', authenticate, invCtrl.predictRestock);
router.get('/products/:id', authenticate, invCtrl.getProductById);
router.post('/products', authenticate, authorize('admin', 'manager'), validate([
  body('name').trim().notEmpty(),
  body('sku').trim().notEmpty(),
]), invCtrl.createProduct);
router.put('/products/:id', authenticate, authorize('admin', 'manager'), invCtrl.updateProduct);
router.get('/categories', authenticate, invCtrl.getCategories);
router.post('/categories', authenticate, authorize('admin', 'manager'), invCtrl.createCategory);

// ── WAREHOUSES & LOCATIONS ────────────────────────────────────────
router.get('/warehouses', authenticate, invCtrl.getWarehouses);
router.post('/warehouses', authenticate, authorize('admin', 'manager'), validate([
  body('name').trim().notEmpty(),
  body('code').trim().isLength({ min: 1, max: 10 }),
]), invCtrl.createWarehouse);
router.get('/locations', authenticate, invCtrl.getLocations);
router.post('/locations', authenticate, authorize('admin', 'manager'), invCtrl.createLocation);

// ── CONTACTS ──────────────────────────────────────────────────────
router.get('/contacts', authenticate, invCtrl.getContacts);
router.post('/contacts', authenticate, authorize('admin', 'manager'), validate([body('name').trim().notEmpty()]), invCtrl.createContact);

// ── USERS ─────────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('admin', 'manager'), invCtrl.getUsers);
router.put('/profile', authenticate, invCtrl.updateProfile);

module.exports = router;
