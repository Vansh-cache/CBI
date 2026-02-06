/**
 * Dashboard Controller
 * Handles dashboard CRUD operations and assignments
 */

const { validationResult } = require('express-validator');
const pool = require('../database/db');

/**
 * Get all dashboards (filtered by user permissions)
 */
const getDashboards = async (req, res) => {
    try {
        let dashboards;

        // Admin and Developer can see all dashboards
        if (['admin', 'developer'].includes(req.user.role_name)) {
            [dashboards] = await pool.query(
                `SELECT d.*, u.email as created_by_email, 
                 (SELECT COUNT(*) FROM dashboard_assignments WHERE dashboard_id = d.id) as assignment_count
                 FROM dashboards d
                 JOIN users u ON d.created_by = u.id
                 WHERE d.is_active = TRUE
                 ORDER BY d.updated_at DESC`
            );
        } else {
            // Viewers can only see assigned dashboards
            [dashboards] = await pool.query(
                `SELECT d.*, da.permission_type, u.email as created_by_email
                 FROM dashboards d
                 JOIN dashboard_assignments da ON d.id = da.dashboard_id
                 JOIN users u ON d.created_by = u.id
                 WHERE da.user_id = ? AND d.is_active = TRUE
                 ORDER BY d.updated_at DESC`,
                [req.user.id]
            );
        }

        res.json({ success: true, data: dashboards });
    } catch (error) {
        console.error('Get dashboards error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboards' });
    }
};

/**
 * Get dashboard by ID
 */
const getDashboardById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user has access
        let hasAccess = false;
        let permissionType = null;

        if (['admin', 'developer'].includes(req.user.role_name)) {
            hasAccess = true;
        } else {
            // Check assignment
            const [assignments] = await pool.query(
                'SELECT permission_type FROM dashboard_assignments WHERE dashboard_id = ? AND user_id = ?',
                [id, req.user.id]
            );
            if (assignments.length > 0) {
                hasAccess = true;
                permissionType = assignments[0].permission_type;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Dashboard not assigned to you.'
            });
        }

        const [dashboards] = await pool.query(
            `SELECT d.*, u.email as created_by_email
             FROM dashboards d
             JOIN users u ON d.created_by = u.id
             WHERE d.id = ? AND d.is_active = TRUE`,
            [id]
        );

        if (dashboards.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dashboard not found'
            });
        }

        const dashboard = dashboards[0];

        // Add permission info for viewers
        if (permissionType) {
            dashboard.permission_type = permissionType;
        }

        res.json({ success: true, data: dashboard });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard' });
    }
};

/**
 * Create dashboard
 */
const createDashboard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, description, config } = req.body;

        // Validate config is valid JSON
        let dashboardConfig;
        try {
            dashboardConfig = typeof config === 'string' ? JSON.parse(config) : config;
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dashboard configuration JSON'
            });
        }
        // Config schema: { configVersion?: number, widgets: chart config[], selectedDatasets?: number[], category?: string }

        const [result] = await pool.query(
            `INSERT INTO dashboards (name, description, config, created_by) 
             VALUES (?, ?, ?, ?)`,
            [name, description || null, JSON.stringify(dashboardConfig), req.user.id]
        );

        // Fetch created dashboard
        const [dashboards] = await pool.query(
            `SELECT d.*, u.email as created_by_email
             FROM dashboards d
             JOIN users u ON d.created_by = u.id
             WHERE d.id = ?`,
            [result.insertId]
        );

        // Emit real-time update via Socket.IO
        if (req.app.locals.emitDashboardUpdate) {
            req.app.locals.emitDashboardUpdate(result.insertId, dashboards[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Dashboard created successfully',
            data: dashboards[0]
        });
    } catch (error) {
        console.error('Create dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error creating dashboard' });
    }
};

/**
 * Update dashboard
 */
const updateDashboard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { name, description, config } = req.body;

        // Check if user can edit
        let canEdit = false;

        if (['admin', 'developer'].includes(req.user.role_name)) {
            canEdit = true;
        } else {
            // Check if user has edit permission via assignment
            const [assignments] = await pool.query(
                'SELECT permission_type FROM dashboard_assignments WHERE dashboard_id = ? AND user_id = ?',
                [id, req.user.id]
            );
            if (assignments.length > 0 && assignments[0].permission_type === 'edit') {
                canEdit = true;
            }
        }

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to edit this dashboard.'
            });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (config) {
            let dashboardConfig;
            try {
                dashboardConfig = typeof config === 'string' ? JSON.parse(config) : config;
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid dashboard configuration JSON'
                });
            }
            updates.push('config = ?');
            values.push(JSON.stringify(dashboardConfig));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        await pool.query(
            `UPDATE dashboards SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        // Fetch updated dashboard
        const [dashboards] = await pool.query(
            `SELECT d.*, u.email as created_by_email
             FROM dashboards d
             JOIN users u ON d.created_by = u.id
             WHERE d.id = ?`,
            [id]
        );

        // Emit real-time update via Socket.IO
        if (req.app.locals.emitDashboardUpdate) {
            req.app.locals.emitDashboardUpdate(id, dashboards[0]);
        }

        res.json({
            success: true,
            message: 'Dashboard updated successfully',
            data: dashboards[0]
        });
    } catch (error) {
        console.error('Update dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error updating dashboard' });
    }
};

/**
 * Delete dashboard
 */
const deleteDashboard = async (req, res) => {
    try {
        const { id } = req.params;

        // Only admin and developer can delete
        if (!['admin', 'developer'].includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Soft delete
        await pool.query(
            'UPDATE dashboards SET is_active = FALSE WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Dashboard deleted successfully'
        });
    } catch (error) {
        console.error('Delete dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error deleting dashboard' });
    }
};

/**
 * Assign dashboard to users
 */
const assignDashboard = async (req, res) => {
    try {
        const dashboard_id = req.params.id;
        const { user_id, permission_type } = req.body;

        if (!['view', 'edit'].includes(permission_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid permission type. Must be "view" or "edit"'
            });
        }

        // Check if dashboard exists
        const [dashboards] = await pool.query(
            'SELECT id FROM dashboards WHERE id = ? AND is_active = TRUE',
            [dashboard_id]
        );

        if (dashboards.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dashboard not found'
            });
        }

        // Check if user exists
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND is_active = TRUE',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Insert or update assignment
        await pool.query(
            `INSERT INTO dashboard_assignments (dashboard_id, user_id, permission_type, assigned_by) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE permission_type = ?, assigned_by = ?`,
            [dashboard_id, user_id, permission_type, req.user.id, permission_type, req.user.id]
        );

        res.json({
            success: true,
            message: 'Dashboard assigned successfully'
        });
    } catch (error) {
        console.error('Assign dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error assigning dashboard' });
    }
};

/**
 * Unassign dashboard from user
 */
const unassignDashboard = async (req, res) => {
    try {
        const dashboard_id = req.params.id;
        const user_id = req.params.userId;

        await pool.query(
            'DELETE FROM dashboard_assignments WHERE dashboard_id = ? AND user_id = ?',
            [dashboard_id, user_id]
        );

        res.json({
            success: true,
            message: 'Dashboard unassigned successfully'
        });
    } catch (error) {
        console.error('Unassign dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error unassigning dashboard' });
    }
};

/**
 * Get all dashboard assignments (for mapping view)
 */
const getAllAssignments = async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT da.*, d.name as dashboard_name, u.email as user_email, u.first_name, u.last_name
             FROM dashboard_assignments da
             JOIN dashboards d ON da.dashboard_id = d.id
             JOIN users u ON da.user_id = u.id
             WHERE d.is_active = TRUE
             ORDER BY u.last_name, u.first_name, d.name`
        );

        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Get all assignments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignments' });
    }
};

/**
 * Get dashboard assignments
 */
const getDashboardAssignments = async (req, res) => {
    try {
        const { id } = req.params;

        const [assignments] = await pool.query(
            `SELECT da.*, u.email as user_email, u.first_name, u.last_name, 
             a.email as assigned_by_email
             FROM dashboard_assignments da
             JOIN users u ON da.user_id = u.id
             JOIN users a ON da.assigned_by = a.id
             WHERE da.dashboard_id = ?`,
            [id]
        );

        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignments' });
    }
};

module.exports = {
    getDashboards,
    getDashboardById,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    assignDashboard,
    unassignDashboard,
    getAllAssignments,
    getDashboardAssignments
};
