// TELLUS Authentication Middleware
// JWT authentication and authorization

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Admin = require('../models/Admin');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé - Token manquant'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check user type and get user data
            let user;
            switch (decoded.type) {
                case 'user':
                    user = await User.findById(decoded.id).select('-password');
                    break;
                case 'agent':
                    user = await Agent.findById(decoded.id).select('-password');
                    break;
                case 'admin':
                    user = await Admin.findById(decoded.id).select('-password');
                    break;
                default:
                    return res.status(401).json({
                        success: false,
                        message: 'Type d\'utilisateur invalide'
                    });
            }

            // Check if user exists
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Check if user is active
            if (user.isActive === false || user.status === 'inactive') {
                return res.status(401).json({
                    success: false,
                    message: 'Compte désactivé'
                });
            }

            // Check if agent is pending validation
            if (decoded.type === 'agent' && user.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Compte en attente de validation'
                });
            }

            // Grant access
            req.user = user;
            req.userType = decoded.type;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erreur d\'authentification',
            error: error.message
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userType)) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé - Permissions insuffisantes'
            });
        }
        next();
    };
};

// Check specific permissions
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        if (req.userType === 'admin') {
            // Admin has all permissions
            return next();
        }

        if (req.userType === 'agent' && req.user.permissions) {
            if (req.user.permissions.includes(permission)) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Permission insuffisante'
        });
    };
};

// Optional authentication - doesn't fail if no token
exports.optional = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                let user;
                switch (decoded.type) {
                    case 'user':
                        user = await User.findById(decoded.id).select('-password');
                        break;
                    case 'agent':
                        user = await Agent.findById(decoded.id).select('-password');
                        break;
                    case 'admin':
                        user = await Admin.findById(decoded.id).select('-password');
                        break;
                }

                if (user) {
                    req.user = user;
                    req.userType = decoded.type;
                }
            } catch (error) {
                // Token invalid, but we continue without user
                console.log('Optional auth token invalid:', error.message);
            }
        }

        next();
    } catch (error) {
        next();
    }
};