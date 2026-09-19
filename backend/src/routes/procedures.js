// TELLUS Procedures Routes
// Procedure-related endpoints

const express = require('express');
const { protect, optional } = require('../middleware/auth');
const Procedure = require('../models/Procedure');

const router = express.Router();

// @route   GET /api/procedures
// @desc    Get all procedures
// @access  Public
router.get('/', optional, async (req, res) => {
    try {
        const procedures = await Procedure.findActive();
        
        res.json({
            success: true,
            procedures
        });
    } catch (error) {
        console.error('Get procedures error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des procédures' });
    }
});

// @route   GET /api/procedures/:id
// @desc    Get single procedure
// @access  Public
router.get('/:id', optional, async (req, res) => {
    try {
        const procedure = await Procedure.findById(req.params.id);
        
        if (!procedure) {
            return res.status(404).json({ success: false, message: 'Procédure non trouvée' });
        }
        
        res.json({
            success: true,
            procedure
        });
    } catch (error) {
        console.error('Get procedure error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la procédure' });
    }
});

// @route   GET /api/procedures/type/:type
// @desc    Get procedures by type
// @access  Public
router.get('/type/:type', optional, async (req, res) => {
    try {
        const procedures = await Procedure.findByType(req.params.type);
        
        res.json({
            success: true,
            procedures
        });
    } catch (error) {
        console.error('Get procedures by type error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des procédures' });
    }
});

// @route   GET /api/procedures/complexity/:complexity
// @desc    Get procedures by complexity
// @access  Public
router.get('/complexity/:complexity', optional, async (req, res) => {
    try {
        const procedures = await Procedure.findByComplexity(req.params.complexity);
        
        res.json({
            success: true,
            procedures
        });
    } catch (error) {
        console.error('Get procedures by complexity error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des procédures' });
    }
});

module.exports = router;