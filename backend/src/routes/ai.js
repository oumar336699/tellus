// TELLUS AI Routes
// AI-related endpoints (OCR, Score calculation, Chatbot, Decision support)

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const File = require('../models/File');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté'));
        }
    }
});

// All routes require authentication
router.use(protect);

// @route   POST /api/ai/ocr
// @desc    Process document with OCR
// @access  Private
router.post('/ocr', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Fichier requis' });
        }

        // Placeholder for OCR processing
        // In a real implementation, you would use Tesseract.js or similar
        
        const ocrResult = {
            text: 'Texte extrait du document (placeholder)',
            confidence: 0.85,
            language: 'fra'
        };

        res.json({
            success: true,
            data: ocrResult
        });
    } catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du traitement OCR' });
    }
});

// @route   POST /api/ai/score
// @desc    Calculate AI score for file
// @access  Private
router.post('/score', async (req, res) => {
    try {
        const { fileData } = req.body;
        
        // Calculate AI score based on:
        // 1. Document completeness
        // 2. Document quality
        // 3. Information consistency
        // 4. Regulatory compliance
        
        let score = 0;
        const anomalies = [];
        const missingDocuments = [];
        
        // Check document completeness
        if (fileData.requiredDocuments && fileData.requiredDocuments.length > 0) {
            const provided = fileData.requiredDocuments.filter(doc => doc.provided).length;
            const total = fileData.requiredDocuments.length;
            const completenessScore = (provided / total) * 40; // 40% of total score
            score += completenessScore;
            
            fileData.requiredDocuments.forEach(doc => {
                if (doc.required && !doc.provided) {
                    missingDocuments.push(doc.name);
                }
            });
        } else {
            score += 40; // Default if no required documents
        }
        
        // Check document quality (placeholder)
        const qualityScore = 30; // Would analyze image quality, readability, etc.
        score += qualityScore;
        
        // Check information consistency (placeholder)
        const consistencyScore = 20; // Would verify name matches across documents, etc.
        score += consistencyScore;
        
        // Check regulatory compliance (placeholder)
        const complianceScore = 10; // Would verify against legal requirements
        score += complianceScore;
        
        // Generate anomalies if score is low
        if (score < 70) {
            anomalies.push({
                type: 'completeness',
                description: 'Documents manquants',
                severity: 'high'
            });
        }
        
        if (score < 90 && score >= 70) {
            anomalies.push({
                type: 'quality',
                description: 'Qualité des documents à améliorer',
                severity: 'medium'
            });
        }
        
        // Generate recommendation
        let recommendation;
        if (score >= 90) {
            recommendation = 'Dossier conforme, prêt à valider';
        } else if (score >= 70) {
            recommendation = 'Dossier presque complet, quelques améliorations nécessaires';
        } else {
            recommendation = 'Dossier incomplet, action requise avant soumission';
        }
        
        const result = {
            score: Math.round(score),
            anomalies,
            missingDocuments,
            recommendation,
            estimatedDelay: fileData.procedureType === 'immatriculation' ? 180 : 90 // days
        };
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('AI score calculation error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du calcul du score IA' });
    }
});

// @route   POST /api/ai/chatbot
// @desc    Chatbot endpoint for procedural questions
// @access  Private
router.post('/chatbot', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        // Placeholder for chatbot response
        // In a real implementation, you would use RAG with OpenAI/LangChain
        
        let response = 'Je suis désolé, je ne peux pas répondre à cette question pour le moment.';
        
        // Simple keyword-based responses (placeholder)
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('mutation')) {
            response = 'Pour une mutation, vous devez fournir: l\'acte de mutation, le titre foncier original, la CNI du propriétaire, et un justificatif de domicile. Le délai estimé est de 3 à 6 mois.';
        } else if (lowerMessage.includes('immatriculation')) {
            response = 'Pour une immatriculation, vous devez fournir: un titre foncier provisoire, un plan du terrain, la CNI, et des photos du terrain. Le délai estimé est de 6 à 12 mois.';
        } else if (lowerMessage.includes('prix') || lowerMessage.includes('coût')) {
            response = 'Les coûts varient selon la procédure. Consultez l\'onglet "Documents à fournir" pour connaître le prix estimé de chaque procédure.';
        } else if (lowerMessage.includes('délai') || lowerMessage.includes('temps')) {
            response = 'Les délais varient: Immatriculation (6-12 mois), Mutation (3-6 mois), Morcellement (4-8 mois), Concession (6-18 mois).';
        } else if (lowerMessage.includes('rendez-vous')) {
            response = 'Vous pouvez prendre rendez-vous via l\'onglet "Rendez-vous" dans l\'application. Choisissez la date, l\'heure et le motif de votre visite.';
        }
        
        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du traitement de la question' });
    }
});

// @route   GET /api/ai/decision-support/:fileId
// @desc    Get AI decision support for file
// @access  Private
router.get('/decision-support/:fileId', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
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
        
        // Generate decision support
        const summary = `Dossier ${file.reference} - ${file.procedure}. Demandeur: ${file.userName}. Score IA: ${file.aiAnalysis.score}%.`;
        
        const anomalies = file.aiAnalysis.anomalies || [];
        
        const recommendation = file.aiAnalysis.recommendation || 'Analyse requise';
        
        const estimatedDelay = file.aiAnalysis.estimatedDelay || 90;
        
        const riskLevel = file.aiAnalysis.score >= 90 ? 'low' : 
                          file.aiAnalysis.score >= 70 ? 'medium' : 'high';
        
        res.json({
            success: true,
            summary,
            anomalies,
            recommendation,
            estimatedDelay,
            riskLevel
        });
    } catch (error) {
        console.error('Decision support error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la génération du support à la décision' });
    }
});

// @route   POST /api/ai/config
// @desc    Update AI configuration (admin only)
// @access  Private
router.post('/config', protect, authorize('admin'), async (req, res) => {
    try {
        const { aiScoreThreshold, aiScoreWarning } = req.body;
        
        // Update admin settings
        await req.user.updateSettings({
            aiScoreThreshold,
            aiScoreWarning
        });
        
        res.json({
            success: true,
            message: 'Configuration IA mise à jour',
            config: {
                aiScoreThreshold: req.user.settings.aiScoreThreshold,
                aiScoreWarning: req.user.settings.aiScoreWarning
            }
        });
    } catch (error) {
        console.error('AI config error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la configuration IA' });
    }
});

// @route   GET /api/ai/config
// @desc    Get AI configuration
// @access  Private
router.get('/config', protect, authorize('admin'), async (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                aiScoreThreshold: req.user.settings.aiScoreThreshold,
                aiScoreWarning: req.user.settings.aiScoreWarning
            }
        });
    } catch (error) {
        console.error('Get AI config error:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la configuration IA' });
    }
});

module.exports = router;