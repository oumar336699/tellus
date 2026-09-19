// TELLUS Backend Server
// Version 2.0 - Gestion Foncière API

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const procedureRoutes = require('./routes/procedures');
const fileRoutes = require('./routes/files');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for file uploads
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'TELLUS API',
        version: '2.0.0',
        description: 'API pour la gestion foncière - Garoua, Cameroun',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            user: '/api/user',
            agent: '/api/agent',
            admin: '/api/admin',
            ai: '/api/ai',
            procedures: '/api/procedures',
            files: '/api/files'
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`TELLUS API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;