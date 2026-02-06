/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);

// Helper to check if user is admin
const isAdmin = (req) => {
    return req.user.role_id === 1 ||
        req.user.role_id === '1' ||
        (req.user.role_name && String(req.user.role_name).toLowerCase() === 'admin') ||
        (req.user.role && String(req.user.role).toLowerCase() === 'admin');
};

// Permission check for write operations (POST, PUT, DELETE)
const requireApiConfigPermission = (req, res, next) => {
    if (isAdmin(req)) {
        console.log('Admin access granted for route:', req.path);
        return next();
    }
    // For non-admin users, check permission
    return hasPermission('api.config')(req, res, next);
};

// Validation rules
const apiConfigValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('base_url').isURL().withMessage('Valid URL is required'),
    body('method').optional().isIn(['GET', 'POST', 'PUT', 'DELETE']).withMessage('Invalid HTTP method'),
    body('auth_type').optional().isIn(['none', 'bearer', 'api_key', 'basic']).withMessage('Invalid auth type')
];

// Routes
// GET routes - available to all authenticated users (admin, developer, viewer)
// All users need to view API configs to fetch data
router.get('/api-configs',
    adminController.getApiConfigs
);

router.get('/api-configs/:id',
    adminController.getApiConfigById
);

// POST/PUT/DELETE routes - require admin or api.config permission
router.post('/api-configs',
    requireApiConfigPermission,
    apiConfigValidation,
    auditLog('api_config.create', 'api_configuration'),
    adminController.createApiConfig
);

router.put('/api-configs/:id',
    requireApiConfigPermission,
    apiConfigValidation,
    auditLog('api_config.update', 'api_configuration'),
    adminController.updateApiConfig
);

router.delete('/api-configs/:id',
    requireApiConfigPermission,
    auditLog('api_config.delete', 'api_configuration'),
    adminController.deleteApiConfig
);

// Test connection - available to all authenticated users
// Users need to test connections to configure and fetch data
router.post('/api-configs/test',
    adminController.testApiConnection
);

router.get('/audit-logs',
    hasPermission('audit.read'),
    adminController.getAuditLogs
);

// Organization users (admin only) - Microsoft 365
router.get('/organization-users',
    hasRole('admin'),
    adminController.getOrganizationUsers
);

router.post('/organization-users/assign',
    hasRole('admin'),
    [
        body('azure_oid').notEmpty().trim().withMessage('azure_oid required'),
        body('email').trim().notEmpty().isEmail().normalizeEmail().withMessage('Valid email required'),
        body('role_id').isInt({ min: 2, max: 3 }).toInt().withMessage('role_id must be 2 (developer) or 3 (viewer)'),
    ],
    adminController.assignOrganizationUser
);

router.put('/organization-users/:id/role',
    hasRole('admin'),
    [body('role_id').isInt({ min: 1, max: 3 })],
    adminController.updateOrganizationUserRole
);

module.exports = router;
