// TELLUS Authentication Routes
// User, Agent, and Admin authentication endpoints

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/user/login
// @desc    Login as user
// @access  Public
router.post('/user/login', [
    body('name').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, password } = req.body;

        // Find user by name
        const user = await User.findOne({ name }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Check if user is locked
        if (user.isLocked()) {
            return res.status(401).json({ 
                success: false, 
                message: 'Compte temporairement verrouillé' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = user.generateToken();

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la connexion' 
        });
    }
});

// @route   POST /api/auth/agent/login
// @desc    Login as agent
// @access  Public
router.post('/agent/login', [
    body('username').trim().notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, password } = req.body;

        // Find agent by username
        const agent = await Agent.findOne({ username }).select('+password');
        if (!agent) {
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Check if agent is locked
        if (agent.isLocked()) {
            return res.status(401).json({ 
                success: false, 
                message: 'Compte temporairement verrouillé' 
            });
        }

        // Check password
        const isMatch = await agent.comparePassword(password);
        if (!isMatch) {
            await agent.incLoginAttempts();
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Reset login attempts on successful login
        await agent.resetLoginAttempts();
        agent.lastLogin = new Date();
        await agent.save();

        // Generate token
        const token = agent.generateToken();

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: agent._id,
                name: agent.name,
                username: agent.username,
                status: agent.status,
                service: agent.service
            }
        });
    } catch (error) {
        console.error('Agent login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la connexion' 
        });
    }
});

// @route   POST /api/auth/admin/login
// @desc    Login as Super Admin
// @access  Public
router.post('/admin/login', [
    body('name').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
    body('signature').notEmpty().withMessage('La signature est obligatoire')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, password, signature } = req.body;

        // Find admin by name
        const admin = await Admin.findOne({ name }).select('+password');
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Check if admin is locked
        if (admin.isLocked()) {
            return res.status(401).json({ 
                success: false, 
                message: 'Compte temporairement verrouillé' 
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            await admin.incLoginAttempts();
            return res.status(401).json({ 
                success: false, 
                message: 'Identifiants invalides' 
            });
        }

        // Verify signature
        const signatureValid = admin.verifySignature(signature);
        if (!signatureValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Signature invalide' 
            });
        }

        // Reset login attempts on successful login
        await admin.resetLoginAttempts();
        admin.lastLogin = new Date();
        admin.signatureVerified = true;
        await admin.save();

        // Generate token
        const token = admin.generateToken();

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la connexion' 
        });
    }
});

// @route   POST /api/auth/admin/create
// @desc    Create Super Admin account (first time setup)
// @access  Public
router.post('/admin/create', [
    body('name').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('username').trim().notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('grade').trim().notEmpty().withMessage('Le grade est obligatoire'),
    body('cadre').trim().notEmpty().withMessage('Le cadre est obligatoire'),
    body('matricule').trim().notEmpty().withMessage('Le matricule est obligatoire'),
    body('signature').notEmpty().withMessage('La signature est obligatoire')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Check if admin already exists
        const adminExists = await Admin.adminExists();
        if (adminExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Un compte Super Admin existe déjà' 
            });
        }

        const adminData = {
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            grade: req.body.grade,
            cadre: req.body.cadre,
            matricule: req.body.matricule,
            signature: req.body.signature,
            permissions: [
                'manage_agents',
                'manage_services',
                'assign_files',
                'view_all_files',
                'modify_procedures',
                'view_supervision',
                'manage_settings',
                'view_logs',
                'generate_reports'
            ]
        };

        const admin = await Admin.create(adminData);

        res.status(201).json({
            success: true,
            message: 'Compte Super Admin créé avec succès',
            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username
            }
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nom d\'utilisateur ou matricule déjà utilisé' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création du compte' 
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change-password', [
    protect,
    body('oldPassword').notEmpty().withMessage('L\'ancien mot de passe est obligatoire'),
    body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { oldPassword, newPassword } = req.body;
        const user = req.user;

        // Check old password
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Ancien mot de passe incorrect' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du changement de mot de passe' 
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            user: {
                id: user._id,
                type: req.userType,
                name: user.name,
                email: user.email,
                phone: user.phone,
                ...(req.userType === 'agent' && {
                    username: user.username,
                    service: user.service,
                    status: user.status
                }),
                ...(req.userType === 'admin' && {
                    username: user.username,
                    permissions: user.permissions
                })
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des informations' 
        });
    }
});

module.exports = router;