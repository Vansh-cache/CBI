/**
 * Authentication Controller
 * Handles Microsoft 365 sign-in, registration, and token management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../database/db');
const { validateMicrosoftToken } = require('../lib/azureAuth');

/**
 * Register a new user
 * Only Admin and Developer can register users
 */
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, first_name, last_name, role_id } = req.body;

        // Check if user already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, passwordHash, first_name, last_name, role_id]
        );

        // Fetch created user
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role_id, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: users[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
};

/**
 * Sign in with Microsoft (organization-only)
 * Validates ID token, looks up user in DB, issues JWT
 */
const loginMicrosoft = async (req, res) => {
    try {
        const { id_token } = req.body;
        if (!id_token) {
            return res.status(400).json({ success: false, message: 'ID token is required' });
        }

        const decoded = await validateMicrosoftToken(id_token);
        const azureOid = decoded.oid;
        const email = decoded.email || decoded.preferred_username || decoded.upn;
        const givenName = decoded.given_name || '';
        const familyName = decoded.family_name || decoded.name || '';

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email not found in token' });
        }

        // Lookup by azure_oid first, then by email (for first sign-in of pre-seeded admin)
        let [users] = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.azure_oid = ? OR (u.azure_oid IS NULL AND LOWER(u.email) = LOWER(?))
             ORDER BY u.azure_oid IS NOT NULL DESC
             LIMIT 1`,
            [azureOid, email]
        );

        if (users.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Contact your administrator to get access."
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Update azure_oid on first sign-in (for pre-seeded admin)
        if (!user.azure_oid) {
            await pool.query(
                'UPDATE users SET azure_oid = ?, first_name = COALESCE(NULLIF(first_name, ""), ?), last_name = COALESCE(NULLIF(last_name, ""), ?) WHERE id = ?',
                [azureOid, givenName || user.first_name, familyName || user.last_name, user.id]
            );
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role_name },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        delete user.password_hash;
        delete user.azure_oid; // Don't expose to frontend

        res.json({
            success: true,
            message: 'Sign-in successful',
            data: { user, token }
        });
    } catch (error) {
        console.error('Microsoft login error:', error);
        if (error.message?.includes('Azure configuration')) {
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please sign in again.' });
        }
        res.status(401).json({ success: false, message: 'Invalid token. Please sign in again.' });
    }
};

/**
 * Get current user
 */
const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role_id, r.name as role_name, u.created_at 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
};

module.exports = { register, loginMicrosoft, getMe };
