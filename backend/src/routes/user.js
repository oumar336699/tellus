// TELLUS User Routes
// User-specific endpoints

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const File = require('../models/File');
const Appointment = require('../models/Appointment');

const router = express.Router();

// All routes require authentication and user role
router.use(protect);
router.use(authorize('user'));

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                language: user.language,
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
    try {
        const { name, email, phone, address, language, notificationPreferences } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email, phone, address, language, notificationPreferences },
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                language: user.language,
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
    }
});

// @route   GET /api/user/appointments
// @desc    Get user appointments
// @access  Private
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.findByUser(req.user.id);
        
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des rendez-vous' });
    }
});

// @route   POST /api/user/appointments
// @desc    Create new appointment
// @access  Private
router.post('/appointments', async (req, res) => {
    try {
        const { date, time, procedure, motif } = req.body;
        
        const appointment = await Appointment.create({
            user: req.user.id,
            userName: req.user.name,
            date,
            time,
            procedure,
            motif
        });
        
        res.status(201).json({
            success: true,
            message: 'Rendez-vous créé avec succès',
            appointment
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du rendez-vous' });
    }
});

// @route   GET /api/user/files
// @desc    Get user files
// @access  Private
router.get('/files', async (req, res) => {
    try {
        const files = await File.findByUser(req.user.id);
        
        res.json({
            success: true,
            files
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des dossiers' });
    }
});

// @route   POST /api/user/files
// @desc    Create new file
// @access  Private
router.post('/files', async (req, res) => {
    try {
        const { procedure, procedureType, documents, requiredDocuments } = req.body;
        
        const file = await File.create({
            user: req.user.id,
            userName: req.user.name,
            userCNI: req.user.cniNumber,
            procedure,
            procedureType,
            documents: documents || [],
            requiredDocuments: requiredDocuments || [],
            status: 'draft'
        });
        
        res.status(201).json({
            success: true,
            message: 'Dossier créé avec succès',
            file
        });
    } catch (error) {
        console.error('Create file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du dossier' });
    }
});

// @route   PUT /api/user/files/:id
// @desc    Update file
// @access  Private
router.put('/files/:id', async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        res.json({
            success: true,
            message: 'Dossier mis à jour avec succès',
            file
        });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du dossier' });
    }
});

// @route   POST /api/user/files/:id/submit
// @desc    Submit file for processing
// @access  Private
router.post('/files/:id/submit', async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user.id });
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        file.status = 'submitted';
        file.submissionDate = new Date();
        await file.addHistory('submitted', req.user.id, 'User');
        await file.save();
        
        res.json({
            success: true,
            message: 'Dossier soumis avec succès',
            file
        });
    } catch (error) {
        console.error('Submit file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la soumission du dossier' });
    }
});

// @route   GET /api/user/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', async (req, res) => {
    try {
        // Placeholder for notifications
        // In a real implementation, you would have a Notification model
        res.json({
            success: true,
            notifications: []
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
    }
});

module.exports = router;