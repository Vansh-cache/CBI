/**
 * Main Server File
 * Express server with Socket.IO for real-time updates
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const envCorsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
const allowedCorsOrigins = Array.from(
    new Set([...(defaultCorsOrigins || []), ...(envCorsOrigins || [])])
);

const isCorsOriginAllowed = (origin, callback) => {
    if (!origin) {
        return callback(null, true);
    }

    if (allowedCorsOrigins.includes(origin)) {
        return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
};

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: isCorsOriginAllowed,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: isCorsOriginAllowed,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/data', require('./routes/data'));
app.use('/api/charts', require('./routes/charts'));
app.use('/api/admin', require('./routes/admin'));

// Socket.IO authentication and real-time updates
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    const jwt = require('jsonwebtoken');
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production'
        );
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Subscribe to dashboard updates
    socket.on('subscribe:dashboard', (dashboardId) => {
        socket.join(`dashboard:${dashboardId}`);
        console.log(`User ${socket.userId} subscribed to dashboard ${dashboardId}`);
    });

    // Unsubscribe from dashboard updates
    socket.on('unsubscribe:dashboard', (dashboardId) => {
        socket.leave(`dashboard:${dashboardId}`);
        console.log(`User ${socket.userId} unsubscribed from dashboard ${dashboardId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

// Helper function to emit dashboard updates
const emitDashboardUpdate = (dashboardId, dashboardData) => {
    io.to(`dashboard:${dashboardId}`).emit('dashboard:updated', {
        dashboardId,
        dashboard: dashboardData,
        timestamp: new Date().toISOString()
    });
};

// Export io and emit function for use in controllers
app.locals.io = io;
app.locals.emitDashboardUpdate = emitDashboardUpdate;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on 0.0.0.0:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
