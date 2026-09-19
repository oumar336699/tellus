// TELLUS Agent Routes
// Agent-specific endpoints

const express = require('express');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const Agent = require('../models/Agent');
const File = require('../models/File');
const Appointment = require('../models/Appointment');

const router = express.Router();

// All routes require authentication and agent role
router.use(protect);
router.use(authorize('agent'));

// @route   GET /api/agent/profile
// @desc    Get agent profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        const agent = await Agent.findById(req.user.id).populate('service');
        
        res.json({
            success: true,
            agent: {
                id: agent._id,
                name: agent.name,
                username: agent.username,
                email: agent.email,
                phone: agent.phone,
                grade: agent.grade,
                cadre: agent.cadre,
                matricule: agent.matricule,
                service: agent.service,
                status: agent.status,
                permissions: agent.permissions,
                stats: agent.stats
            }
        });
    } catch (error) {
        console.error('Get agent profile error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
});

// @route   GET /api/agent/appointments
// @desc    Get agent appointments
// @access  Private
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.findByAgent(req.user.id);
        
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des rendez-vous' });
    }
});

// @route   POST /api/agent/appointments/:id/process
// @desc    Process appointment
// @access  Private
router.post('/appointments/:id/process', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
        }
        
        await appointment.complete(req.user.id);
        await req.user.updateStats('appointment_processed');
        
        res.json({
            success: true,
            message: 'Rendez-vous traité avec succès',
            appointment
        });
    } catch (error) {
        console.error('Process appointment error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du traitement du rendez-vous' });
    }
});

// @route   GET /api/agent/files
// @desc    Get agent assigned files
// @access  Private
router.get('/files', async (req, res) => {
    try {
        const files = await File.findByAgent(req.user.id);
        
        res.json({
            success: true,
            files
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des dossiers' });
    }
});

// @route   GET /api/agent/files/:id
// @desc    Get file details
// @access  Private
router.get('/files/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('service', 'name')
            .populate('assignedAgent', 'name');
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        // Check if agent has access to this file
        if (file.assignedAgent && file.assignedAgent._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        res.json({
            success: true,
            file
        });
    } catch (error) {
        console.error('Get file details error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du dossier' });
    }
});

// @route   POST /api/agent/files/:id/validate
// @desc    Validate file
// @access  Private
router.post('/files/:id/validate', checkPermission('validate_files'), async (req, res) => {
    try {
        const { reason } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        await file.validate(req.user.id, reason);
        await req.user.updateStats('file_validated');
        
        res.json({
            success: true,
            message: 'Dossier validé avec succès',
            file
        });
    } catch (error) {
        console.error('Validate file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la validation du dossier' });
    }
});

// @route   POST /api/agent/files/:id/reject
// @desc    Reject file
// @access  Private
router.post('/files/:id/reject', checkPermission('reject_files'), async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Le motif du rejet est obligatoire' });
        }
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        await file.reject(req.user.id, reason);
        await req.user.updateStats('file_rejected');
        
        res.json({
            success: true,
            message: 'Dossier rejeté',
            file
        });
    } catch (error) {
        console.error('Reject file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du rejet du dossier' });
    }
});

// @route   POST /api/agent/files/:id/complement
// @desc    Request complement for file
// @access  Private
router.post('/files/:id/complement', checkPermission('request_complement'), async (req, res) => {
    try {
        const { missingDocuments, reason } = req.body;
        
        if (!missingDocuments || missingDocuments.length === 0) {
            return res.status(400).json({ success: false, message: 'Les documents manquants sont obligatoires' });
        }
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        // Set deadline for complement (30 days from now)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        
        await file.requestComplement(req.user.id, missingDocuments, reason, deadline);
        
        res.json({
            success: true,
            message: 'Demande de complément envoyée',
            file
        });
    } catch (error) {
        console.error('Request complement error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la demande de complément' });
    }
});

// @route   GET /api/agent/history
// @desc    Get agent processing history
// @access  Private
router.get('/history', async (req, res) => {
    try {
        const files = await File.find({
            'decision.madeBy': req.user.id
        }).sort({ 'decision.madeAt': -1 });
        
        res.json({
            success: true,
            history: files.map(file => ({
                fileReference: file.reference,
                procedure: file.procedure,
                action: file.decision.type,
                date: file.decision.madeAt,
                aiScore: file.aiAnalysis.score
            }))
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
    }
});

module.exports = router;