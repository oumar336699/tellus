// TELLUS Admin Routes
// Super Admin-specific endpoints

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Admin = require('../models/Admin');
const Agent = require('../models/Agent');
const Service = require('../models/Service');
const File = require('../models/File');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        
        res.json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                phone: admin.phone,
                grade: admin.grade,
                cadre: admin.cadre,
                matricule: admin.matricule,
                permissions: admin.permissions,
                settings: admin.settings,
                stats: admin.stats
            }
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
});

// @route   GET /api/admin/agents
// @desc    Get all agents
// @access  Private
router.get('/agents', async (req, res) => {
    try {
        const agents = await Agent.find().populate('service');
        
        res.json({
            success: true,
            agents
        });
    } catch (error) {
        console.error('Get agents error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des agents' });
    }
});

// @route   POST /api/admin/agents
// @desc    Create new agent
// @access  Private
router.post('/agents', async (req, res) => {
    try {
        const agentData = {
            ...req.body,
            status: 'pending'
        };
        
        const agent = await Agent.create(agentData);
        
        res.status(201).json({
            success: true,
            message: 'Agent créé avec succès',
            agent
        });
    } catch (error) {
        console.error('Create agent error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur ou matricule déjà utilisé' });
        }
        res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'agent' });
    }
});

// @route   POST /api/admin/agents/:id/validate
// @desc    Validate agent account
// @access  Private
router.post('/agents/:id/validate', async (req, res) => {
    try {
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'active',
                validatedBy: req.user.id,
                validatedAt: new Date()
            },
            { new: true }
        );
        
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent non trouvé' });
        }
        
        await req.user.updateStats('agentsValidated');
        
        res.json({
            success: true,
            message: 'Agent validé avec succès',
            agent
        });
    } catch (error) {
        console.error('Validate agent error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la validation de l\'agent' });
    }
});

// @route   POST /api/admin/agents/:id/reject
// @desc    Reject agent account
// @access  Private
router.post('/agents/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { status: 'inactive' },
            { new: true }
        );
        
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent non trouvé' });
        }
        
        res.json({
            success: true,
            message: 'Agent rejeté',
            agent
        });
    } catch (error) {
        console.error('Reject agent error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du rejet de l\'agent' });
    }
});

// @route   DELETE /api/admin/agents/:id
// @desc    Delete agent
// @access  Private
router.delete('/agents/:id', async (req, res) => {
    try {
        const agent = await Agent.findByIdAndDelete(req.params.id);
        
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent non trouvé' });
        }
        
        res.json({
            success: true,
            message: 'Agent supprimé avec succès'
        });
    } catch (error) {
        console.error('Delete agent error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'agent' });
    }
});

// @route   GET /api/admin/services
// @desc    Get all services
// @access  Private
router.get('/services', async (req, res) => {
    try {
        const services = await Service.find().populate('headOfService');
        
        res.json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des services' });
    }
});

// @route   POST /api/admin/services
// @desc    Create new service
// @access  Private
router.post('/services', async (req, res) => {
    try {
        const service = await Service.create(req.body);
        
        await req.user.updateStats('servicesCreated');
        
        res.status(201).json({
            success: true,
            message: 'Service créé avec succès',
            service
        });
    } catch (error) {
        console.error('Create service error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Code de service déjà utilisé' });
        }
        res.status(500).json({ success: false, message: 'Erreur lors de la création du service' });
    }
});

// @route   DELETE /api/admin/services/:id
// @desc    Delete service
// @access  Private
router.delete('/services/:id', async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service non trouvé' });
        }
        
        res.json({
            success: true,
            message: 'Service supprimé avec succès'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du service' });
    }
});

// @route   GET /api/admin/files/unassigned
// @desc    Get unassigned files
// @access  Private
router.get('/files/unassigned', async (req, res) => {
    try {
        const files = await File.findUnassigned();
        
        res.json({
            success: true,
            files
        });
    } catch (error) {
        console.error('Get unassigned files error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des dossiers' });
    }
});

// @route   POST /api/admin/files/:id/assign
// @desc    Assign file to service
// @access  Private
router.post('/files/:id/assign', async (req, res) => {
    try {
        const { serviceId } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        await file.assignToService(serviceId);
        await req.user.updateStats('filesAssigned');
        
        res.json({
            success: true,
            message: 'Dossier assigné avec succès',
            file
        });
    } catch (error) {
        console.error('Assign file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation du dossier' });
    }
});

// @route   GET /api/admin/supervision
// @desc    Get supervision data
// @access  Private
router.get('/supervision', async (req, res) => {
    try {
        const stats = await File.getStatistics();
        
        // Calculate additional statistics
        const totalFiles = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0);
        const processingRate = totalFiles > 0 
            ? ((stats.validated?.count || 0) / totalFiles) * 100 
            : 0;
        const rejectionRate = totalFiles > 0 
            ? ((stats.rejected?.count || 0) / totalFiles) * 100 
            : 0;
        
        // AI Score statistics
        const aiScoreStats = {
            averageScore: 0,
            compliantRate: 0,
            warningRate: 0,
            rejectionRate: 0,
            missingDocuments: []
        };
        
        // Calculate AI score statistics from files
        const files = await File.find({ 'aiAnalysis.score': { $exists: true } });
        if (files.length > 0) {
            const totalScore = files.reduce((sum, file) => sum + (file.aiAnalysis.score || 0), 0);
            aiScoreStats.averageScore = Math.round(totalScore / files.length);
            
            const compliant = files.filter(f => f.aiAnalysis.score >= 90).length;
            const warning = files.filter(f => f.aiAnalysis.score >= 70 && f.aiAnalysis.score < 90).length;
            const rejected = files.filter(f => f.aiAnalysis.score < 70).length;
            
            aiScoreStats.compliantRate = Math.round((compliant / files.length) * 100);
            aiScoreStats.warningRate = Math.round((warning / files.length) * 100);
            aiScoreStats.rejectionRate = Math.round((rejected / files.length) * 100);
        }
        
        res.json({
            success: true,
            data: {
                totalFiles,
                processingRate: Math.round(processingRate),
                rejectionRate: Math.round(rejectionRate),
                averageDelay: 0, // Would calculate from actual data
                aiScoreStats
            }
        });
    } catch (error) {
        console.error('Get supervision error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des données de supervision' });
    }
});

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Private
router.put('/settings', async (req, res) => {
    try {
        await req.user.updateSettings(req.body);
        
        res.json({
            success: true,
            message: 'Paramètres mis à jour avec succès',
            settings: req.user.settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des paramètres' });
    }
});

// @route   GET /api/admin/logs
// @desc    Get audit logs
// @access  Private
router.get('/logs', async (req, res) => {
    try {
        // Placeholder for logs
        // In a real implementation, you would have a Log model
        res.json({
            success: true,
            logs: []
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des journaux' });
    }
});

// @route   POST /api/admin/reports/:type
// @desc    Generate report
// @access  Private
router.post('/reports/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        // Placeholder for report generation
        // In a real implementation, you would generate PDF/Excel reports
        
        res.json({
            success: true,
            message: `Rapport ${type} généré avec succès`,
            reportUrl: `/reports/${type}_${Date.now()}.pdf`
        });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la génération du rapport' });
    }
});

module.exports = router;