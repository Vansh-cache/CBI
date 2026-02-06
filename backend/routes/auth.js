/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('role_id').isInt({ min: 1, max: 3 })
];

// Routes
router.post('/register',
    authenticate,
    hasRole('admin'),
    registerValidation,
    auditLog('user.register', 'user'),
    authController.register
);

router.post('/login',
    auditLog('user.login', 'user'),
    authController.loginMicrosoft
);

router.get('/me',
    authenticate,
    authController.getMe
);

module.exports = router;
