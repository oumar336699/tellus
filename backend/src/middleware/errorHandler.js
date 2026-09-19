// TELLUS Error Handler Middleware
// Centralized error handling

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Ressource non trouvée';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplication: ${field} déjà utilisé`;
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token invalide';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expiré';
        error = { message, statusCode: 401 };
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            const message = 'Fichier trop volumineux';
            error = { message, statusCode: 400 };
        } else {
            const message = 'Erreur lors du téléversement du fichier';
            error = { message, statusCode: 400 };
        }
    }

    res.status(error.statusCode || err.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;