/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);

// Validation rules
const dashboardValidation = [
    body('name').trim().notEmpty().withMessage('Dashboard name is required'),
    body('config').custom((value) => {
        try {
            JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
            return true;
        } catch (e) {
            throw new Error('Invalid dashboard configuration');
        }
    })
];

// Routes
router.get('/', 
    hasPermission('dashboards.read'),
    dashboardController.getDashboards
);

router.get('/assignments', 
    hasPermission('dashboards.read'),
    dashboardController.getAllAssignments
);

router.get('/:id', 
    hasPermission('dashboards.read'),
    dashboardController.getDashboardById
);

router.post('/', 
    hasPermission('dashboards.create'),
    dashboardValidation,
    auditLog('dashboard.create', 'dashboard'),
    dashboardController.createDashboard
);

router.put('/:id', 
    hasPermission('dashboards.update'),
    dashboardValidation,
    auditLog('dashboard.update', 'dashboard'),
    dashboardController.updateDashboard
);

router.delete('/:id', 
    hasPermission('dashboards.delete'),
    auditLog('dashboard.delete', 'dashboard'),
    dashboardController.deleteDashboard
);

router.post('/:id/assign', 
    hasPermission('dashboards.assign'),
    [
        body('user_id').isInt(),
        body('permission_type').isIn(['view', 'edit'])
    ],
    auditLog('dashboard.assign', 'dashboard'),
    dashboardController.assignDashboard
);

router.delete('/:id/assign/:userId', 
    hasPermission('dashboards.assign'),
    dashboardController.unassignDashboard
);

router.get('/:id/assignments', 
    hasPermission('dashboards.read'),
    dashboardController.getDashboardAssignments
);

module.exports = router;
