// TELLUS 404 Not Found Handler
// Handles requests to non-existent routes

const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} non trouvée`,
        method: req.method
    });
};

module.exports = notFoundHandler;