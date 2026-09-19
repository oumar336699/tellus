// TELLUS AI Module
// Handles all AI-related functionality: Chatbot RAG, OCR, Score de validité, Aide à la décision

const AI = {
    // AI Configuration
    config: {
        ocrEndpoint: '/api/ai/ocr',
        scoreEndpoint: '/api/ai/score',
        chatbotEndpoint: '/api/ai/chatbot',
        decisionSupportEndpoint: '/api/ai/decision-support'
    },

    // Initialize AI Module
    init: function() {
        console.log('Initializing AI Module');
        this.setupChatbot();
    },

    // Setup Chatbot
    setupChatbot: function() {
        // Add chatbot button to UI if not exists
        if (!document.getElementById('chatbot-button')) {
            this.addChatbotButton();
        }
    },

    // Add Chatbot Button
    addChatbotButton: function() {
        const button = document.createElement('button');
        button.id = 'chatbot-button';
        button.className = 'chatbot-button';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
        `;
        button.addEventListener('click', () => this.showChatbot());
        document.body.appendChild(button);
    },

    // Show Chatbot
    showChatbot: function() {
        TellusApp.showModal('chatbot-modal');
        this.setupChatbotUI();
    },

    // Setup Chatbot UI
    setupChatbotUI: function() {
        const modal = document.getElementById('chatbot-modal');
        if (!modal) {
            this.createChatbotModal();
            return;
        }

        const chatInput = document.getElementById('chatbot-input');
        const sendButton = document.getElementById('chatbot-send');

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatbotMessage();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendChatbotMessage());
        }
    },

    // Create Chatbot Modal
    createChatbotModal: function() {
        const modal = document.createElement('div');
        modal.id = 'chatbot-modal';
        modal.className = 'modal hidden chatbot-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Assistant IA</h3>
                    <button class="modal-close-button" onclick="TellusApp.closeModal()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chatbot-message bot-message">
                        <p>Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider avec les procédures foncières ?</p>
                    </div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Posez votre question...">
                    <button id="chatbot-send">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('modal-overlay').after(modal);
        this.setupChatbotUI();
    },

    // Send Chatbot Message
    sendChatbotMessage: async function() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addChatbotMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await TellusApp.apiCall(this.config.chatbotEndpoint, 'POST', {
                message,
                context: this.getChatbotContext()
            });

            this.removeTypingIndicator();

            if (response.success) {
                this.addChatbotMessage(response.response, 'bot');
            } else {
                this.addChatbotMessage('Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.', 'bot');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addChatbotMessage('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'bot');
        }
    },

    // Add Chatbot Message
    addChatbotMessage: function(message, type) {
        const container = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${type}-message`;
        messageDiv.innerHTML = `<p>${message}</p>`;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    // Show Typing Indicator
    showTypingIndicator: function() {
        const container = document.getElementById('chatbot-messages');
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'chatbot-message bot-message typing';
        indicator.innerHTML = '<p>En train d\'écrire...</p>';
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    },

    // Remove Typing Indicator
    removeTypingIndicator: function() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // Get Chatbot Context
    getChatbotContext: function() {
        const context = {
            userType: TellusApp.state.userType,
            currentScreen: TellusApp.getCurrentScreen()
        };

        // Add specific context based on user type
        if (TellusApp.state.userType === 'user' && typeof UserSpace !== 'undefined') {
            context.userData = UserSpace.userData;
        } else if (TellusApp.state.userType === 'agent' && typeof AgentSpace !== 'undefined') {
            context.agentData = AgentSpace.agentData;
        }

        return context;
    },

    // OCR - Process Document
    processDocumentOCR: async function(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${TellusApp.config.apiBaseUrl}${this.config.ocrEndpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TellusApp.state.currentUser.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'OCR Error');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            throw error;
        }
    },

    // Calculate AI Score for File
    calculateAIScore: async function(fileData) {
        try {
            const response = await TellusApp.apiCall(this.config.scoreEndpoint, 'POST', {
                fileData
            });

            if (response.success) {
                return {
                    score: response.score,
                    anomalies: response.anomalies,
                    missingDocuments: response.missingDocuments,
                    recommendation: response.recommendation
                };
            } else {
                throw new Error(response.message || 'Score calculation error');
            }
        } catch (error) {
            console.error('AI Score Error:', error);
            throw error;
        }
    },

    // Get Decision Support
    getDecisionSupport: async function(fileId) {
        try {
            const response = await TellusApp.apiCall(`${this.config.decisionSupportEndpoint}/${fileId}`);

            if (response.success) {
                return {
                    summary: response.summary,
                    anomalies: response.anomalies,
                    recommendation: response.recommendation,
                    estimatedDelay: response.estimatedDelay,
                    riskLevel: response.riskLevel
                };
            } else {
                throw new Error(response.message || 'Decision support error');
            }
        } catch (error) {
            console.error('Decision Support Error:', error);
            throw error;
        }
    },

    // Validate Document Quality
    validateDocumentQuality: async function(file) {
        try {
            // Check file size
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                return {
                    valid: false,
                    reason: 'Fichier trop volumineux (max 10MB)'
                };
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                return {
                    valid: false,
                    reason: 'Type de fichier non supporté (JPEG, PNG, PDF uniquement)'
                };
            }

            // For images, check dimensions
            if (file.type.startsWith('image/')) {
                const dimensions = await this.getImageDimensions(file);
                if (dimensions.width < 300 || dimensions.height < 300) {
                    return {
                        valid: false,
                        reason: 'Image trop petite (min 300x300px)'
                    };
                }
            }

            return {
                valid: true,
                reason: 'Document valide'
            };
        } catch (error) {
            console.error('Document validation error:', error);
            return {
                valid: false,
                reason: 'Erreur lors de la validation du document'
            };
        }
    },

    // Get Image Dimensions
    getImageDimensions: function(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    },

    // Check Document Readability
    checkDocumentReadability: async function(file) {
        try {
            // Use OCR to check if text can be extracted
            const ocrResult = await this.processDocumentOCR(file);
            
            if (ocrResult.text && ocrResult.text.length > 50) {
                return {
                    readable: true,
                    confidence: ocrResult.confidence || 0
                };
            } else {
                return {
                    readable: false,
                    confidence: ocrResult.confidence || 0,
                    reason: 'Texte non extractible ou illisible'
                };
            }
        } catch (error) {
            console.error('Readability check error:', error);
            return {
                readable: false,
                confidence: 0,
                reason: 'Erreur lors de la vérification de lisibilité'
            };
        }
    },

    // Anonymize Document (for privacy)
    anonymizeDocument: async function(file) {
        try {
            const response = await TellusApp.apiCall('/api/ai/anonymize', 'POST', {
                file
            });

            if (response.success) {
                return response.anonymizedFile;
            } else {
                throw new Error(response.message || 'Anonymization error');
            }
        } catch (error) {
            console.error('Anonymization error:', error);
            throw error;
        }
    },

    // Compare Documents (for duplicate detection)
    compareDocuments: async function(file1, file2) {
        try {
            const response = await TellusApp.apiCall('/api/ai/compare', 'POST', {
                file1,
                file2
            });

            if (response.success) {
                return {
                    similarity: response.similarity,
                    isDuplicate: response.isDuplicate,
                    differences: response.differences
                };
            } else {
                throw new Error(response.message || 'Comparison error');
            }
        } catch (error) {
            console.error('Document comparison error:', error);
            throw error;
        }
    },

    // Extract Key Information from Document
    extractKeyInfo: async function(file, documentType) {
        try {
            const response = await TellusApp.apiCall('/api/ai/extract', 'POST', {
                file,
                documentType
            });

            if (response.success) {
                return response.extractedData;
            } else {
                throw new Error(response.message || 'Extraction error');
            }
        } catch (error) {
            console.error('Key info extraction error:', error);
            throw error;
        }
    },

    // Get AI Configuration
    getAIConfig: async function() {
        try {
            const response = await TellusApp.apiCall('/admin/ai/config');

            if (response.success) {
                return response.config;
            } else {
                throw new Error(response.message || 'Config error');
            }
        } catch (error) {
            console.error('AI config error:', error);
            throw error;
        }
    },

    // Update AI Configuration
    updateAIConfig: async function(config) {
        try {
            const response = await TellusApp.apiCall('/admin/ai/config', 'POST', config);

            if (response.success) {
                TellusApp.showSuccess('Configuration IA mise à jour');
                return true;
            } else {
                TellusApp.showError(response.message || 'Configuration error');
                return false;
            }
        } catch (error) {
            console.error('AI config update error:', error);
            TellusApp.showError('Erreur lors de la mise à jour de la configuration IA');
            return false;
        }
    }
};

// Initialize AI module
document.addEventListener('DOMContentLoaded', () => {
    AI.init();
});

// Make AI available globally
window.AI = AI;