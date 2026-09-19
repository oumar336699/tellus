// TELLUS Files Routes
// File-related endpoints

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const File = require('../models/File');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté'));
        }
    }
});

// All routes require authentication
router.use(protect);

// @route   GET /api/files/:id
// @desc    Get file details
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('service', 'name')
            .populate('assignedAgent', 'name');
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        // Check authorization
        if (req.userType === 'user' && file.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        if (req.userType === 'agent' && file.assignedAgent && file.assignedAgent.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        res.json({
            success: true,
            file
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du dossier' });
    }
});

// @route   POST /api/files/:id/documents
// @desc    Upload document to file
// @access  Private
router.post('/:id/documents', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Fichier requis' });
        }
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        // Check authorization
        if (req.userType === 'user' && file.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        const documentData = {
            name: req.body.name || req.file.originalname,
            type: req.body.type || 'document',
            url: `/uploads/${req.file.filename}`,
            uploadDate: new Date()
        };
        
        await file.addDocument(documentData);
        
        res.json({
            success: true,
            message: 'Document ajouté avec succès',
            document: documentData
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du téléversement du document' });
    }
});

// @route   GET /api/files/:id/documents/:documentId
// @desc    Get document from file
// @access  Private
router.get('/:id/documents/:documentId', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        const document = file.documents.id(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document non trouvé' });
        }
        
        // Check authorization
        if (req.userType === 'user' && file.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        // Send file
        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(document.url));
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ success: false, message: 'Fichier non trouvé' });
        }
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du document' });
    }
});

// @route   DELETE /api/files/:id/documents/:documentId
// @desc    Delete document from file
// @access  Private
router.delete('/:id/documents/:documentId', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
        }
        
        // Check authorization
        if (req.userType === 'user' && file.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        const document = file.documents.id(req.params.documentId);
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document non trouvé' });
        }
        
        // Delete physical file
        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(document.url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove document from array
        file.documents.pull(req.params.documentId);
        await file.save();
        
        res.json({
            success: true,
            message: 'Document supprimé avec succès'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du document' });
    }
});

module.exports = router;