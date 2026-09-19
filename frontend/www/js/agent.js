// TELLUS Agent Space Module
// Handles all agent-related functionality with Firebase

const AgentSpace = {
    // Agent data
    agentData: null,
    appointments: [],
    files: [],
    history: [],
    syncListeners: [],

    // Initialize Agent Space
    async init() {
        console.log('Initializing Agent Space');
        
        try {
            // Load agent data from app state
            this.agentData = TellusApp.state.currentUser;
            this.updateProfileUI();
            
            // Setup real-time sync for appointments
            this.setupAppointmentsSync();
            
            // Setup real-time sync for assigned files
            this.setupFilesSync();
            
            // Load history
            await this.loadHistory();
            
            // Update dashboard
            this.updateDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Agent Space initialized successfully');
        } catch (error) {
            console.error('Error initializing Agent Space:', error);
            TellusApp.showError('Erreur lors du chargement de vos données');
        }
    },

    // Setup Real-time Sync for Appointments
    setupAppointmentsSync() {
        const listenerId = TellusApp.subscribeToCollection(
            'appointments',
            (appointments) => {
                this.appointments = appointments;
                this.renderAppointments();
                this.updateDashboard();
            }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Files
    setupFilesSync() {
        const serviceId = this.agentData.service;
        const listenerId = TellusApp.subscribeToCollection(
            'files',
            (files) => {
                this.files = files.filter(f => f.serviceId === serviceId);
                this.renderFiles();
                this.updateDashboard();
            },
            { field: 'serviceId', operator: '==', value: serviceId }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Cleanup Sync Listeners
    cleanupSyncListeners() {
        this.syncListeners.forEach(listenerId => {
            TellusApp.unsubscribeFromCollection(listenerId);
        });
        this.syncListeners = [];
    },

    // Update Profile UI
    updateProfileUI: function() {
        if (this.agentData) {
            document.getElementById('agent-profile-name').textContent = this.agentData.name || '-';
            document.getElementById('agent-profile-username').textContent = this.agentData.username || '-';
            document.getElementById('agent-profile-service').textContent = this.agentData.service || '-';
        }
    },

    // Load Appointments (now handled by real-time sync)
    async loadAppointments() {
        // This is now handled by setupAppointmentsSync
        // Kept for compatibility
    },

    // Render Appointments
    renderAppointments: function() {
        const container = document.getElementById('agent-appointments-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.appointments.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun rendez-vous à traiter</p>';
            return;
        }

        this.appointments.forEach(appointment => {
            const appointmentCard = this.createAppointmentCard(appointment);
            container.appendChild(appointmentCard);
        });
    },

    // Create Appointment Card
    createAppointmentCard: function(appointment) {
        const card = document.createElement('div');
        card.className = 'appointment-card agent-appointment';
        
        const date = new Date(appointment.date);
        const formattedDate = date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        card.innerHTML = `
            <div class="appointment-header">
                <div class="appointment-date">
                    <span class="date-day">${date.getDate()}</span>
                    <span class="date-month">${date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                </div>
                <div class="appointment-time">${appointment.time}</div>
            </div>
            <div class="appointment-details">
                <h4>${appointment.userName || 'Usager'}</h4>
                <p class="appointment-procedure">${appointment.procedure || 'Non spécifié'}</p>
                <p class="appointment-motif">${appointment.motif || 'Sans motif'}</p>
            </div>
            <div class="appointment-actions">
                <button class="action-button" onclick="AgentSpace.processAppointment('${appointment.id}')">
                    Traiter
                </button>
            </div>
        `;

        return card;
    },

    // Process Appointment
    async processAppointment(appointmentId) {
        try {
            const result = await TellusApp.updateDocument('appointments', appointmentId, {
                status: 'processed',
                processedBy: this.agentData.uid,
                processedAt: new Date().toISOString()
            });
            
            if (result.success) {
                TellusApp.showSuccess('Rendez-vous marqué comme traité');
            } else {
                TellusApp.showError('Erreur lors du traitement');
            }
        } catch (error) {
            console.error('Error processing appointment:', error);
            TellusApp.showError('Erreur lors du traitement du rendez-vous');
        }
    },

    // Load Files (now handled by real-time sync)
    async loadFiles() {
        // This is now handled by setupFilesSync
        // Kept for compatibility
    },

    // Render Files
    renderFiles: function() {
        const container = document.getElementById('agent-files-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.files.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun dossier assigné</p>';
            return;
        }

        this.files.forEach(file => {
            const fileCard = this.createFileCard(file);
            container.appendChild(fileCard);
        });
    },

    // Create File Card
    createFileCard: function(file) {
        const card = document.createElement('div');
        card.className = 'file-card agent-file';
        
        // AI Score color
        const scoreColor = this.getScoreColor(file.aiScore);
        
        card.innerHTML = `
            <div class="file-header">
                <span class="file-reference">${file.reference}</span>
                <span class="file-status status-${file.status}">${this.getStatusLabel(file.status)}</span>
            </div>
            <div class="file-body">
                <h4>${file.procedure}</h4>
                <p class="file-user">Demandeur: ${file.userName || 'Non spécifié'}</p>
                <p class="file-date">Déposé le: ${new Date(file.submissionDate).toLocaleDateString('fr-FR')}</p>
                <div class="file-ai-score">
                    <span class="score-label">Score IA:</span>
                    <span class="score-value ${scoreColor}">${file.aiScore || 0}%</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="action-button" onclick="AgentSpace.showFileDetail('${file.id}')">
                    Voir détails
                </button>
            </div>
        `;

        return card;
    },

    // Get Score Color
    getScoreColor: function(score) {
        if (score >= 90) return 'score-green';
        if (score >= 70) return 'score-orange';
        return 'score-red';
    },

    // Get Status Label
    getStatusLabel: function(status) {
        const labels = {
            'submitted': 'Déposé',
            'in_progress': 'En instruction',
            'complement_requested': 'Complément demandé',
            'validated': 'Validé',
            'rejected': 'Rejeté'
        };
        return labels[status] || status;
    },

    // Show File Detail
    async showFileDetail(fileId) {
        try {
            const file = this.files.find(f => f.id === fileId);
            
            if (file) {
                this.populateFileDetailModal(file);
                TellusApp.showModal('file-detail-modal');
            } else {
                TellusApp.showError('Dossier non trouvé');
            }
        } catch (error) {
            console.error('Error loading file detail:', error);
            TellusApp.showError('Erreur lors du chargement du dossier');
        }
    },

    // Populate File Detail Modal
    populateFileDetailModal: function(file) {
        document.getElementById('file-reference').textContent = file.reference;
        document.getElementById('file-status').textContent = this.getStatusLabel(file.status);
        document.getElementById('file-procedure').textContent = file.procedure;
        document.getElementById('file-date').textContent = new Date(file.submissionDate).toLocaleDateString('fr-FR');
        
        // AI Score and analysis
        document.getElementById('ai-completeness-score').textContent = `${file.aiScore || 0}%`;
        document.getElementById('ai-completeness-bar').style.width = `${file.aiScore || 0}%`;
        
        // AI anomalies
        const anomaliesContainer = document.getElementById('ai-anomalies');
        anomaliesContainer.innerHTML = '';
        
        if (file.aiAnomalies && file.aiAnomalies.length > 0) {
            file.aiAnomalies.forEach(anomaly => {
                const anomalyElement = document.createElement('div');
                anomalyElement.className = 'anomaly-item';
                anomalyElement.textContent = anomaly;
                anomaliesContainer.appendChild(anomalyElement);
            });
        } else {
            anomaliesContainer.innerHTML = '<p class="no-anomalies">Aucune anomalie détectée</p>';
        }

        // AI recommendation
        if (file.aiRecommendation) {
            const recommendationElement = document.createElement('div');
            recommendationElement.className = 'ai-recommendation';
            recommendationElement.innerHTML = `
                <h4>Recommandation IA</h4>
                <p>${file.aiRecommendation}</p>
            `;
            anomaliesContainer.appendChild(recommendationElement);
        }

        // Missing documents section
        const missingSection = document.getElementById('missing-documents-section');
        const missingList = document.getElementById('missing-documents-list');
        
        if (file.missingDocuments && file.missingDocuments.length > 0) {
            missingSection.classList.remove('hidden');
            missingList.innerHTML = '';
            
            file.missingDocuments.forEach(doc => {
                const docElement = document.createElement('div');
                docElement.className = 'missing-document-item';
                docElement.textContent = doc;
                missingList.appendChild(docElement);
            });
        } else {
            missingSection.classList.add('hidden');
        }

        // Documents list
        const documentsList = document.getElementById('file-documents-list');
        documentsList.innerHTML = '';
        
        if (file.documents && file.documents.length > 0) {
            file.documents.forEach(doc => {
                const docElement = document.createElement('div');
                docElement.className = 'document-item';
                docElement.innerHTML = `
                    <span>${doc.name}</span>
                    <button class="view-button" onclick="AgentSpace.viewDocument('${doc.id}')">Voir</button>
                `;
                documentsList.appendChild(docElement);
            });
        } else {
            documentsList.innerHTML = '<p class="no-documents">Aucun document</p>';
        }

        // Add action buttons for agent
        this.addAgentActionButtons(file);
    },

    // Add Agent Action Buttons
    addAgentActionButtons: function(file) {
        const modalContent = document.querySelector('#file-detail-modal .modal-content');
        
        // Remove existing action buttons
        const existingActions = modalContent.querySelector('.agent-actions');
        if (existingActions) {
            existingActions.remove();
        }

        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'agent-actions';
        
        actionsDiv.innerHTML = `
            <button class="action-button validate-button" onclick="AgentSpace.validateFile('${file.id}')">
                Valider
            </button>
            <button class="action-button reject-button" onclick="AgentSpace.rejectFile('${file.id}')">
                Rejeter
            </button>
            <button class="action-button complement-button" onclick="AgentSpace.requestComplement('${file.id}')">
                Demander complément
            </button>
        `;

        modalContent.appendChild(actionsDiv);
    },

    // Validate File
    async validateFile(fileId) {
        const reason = prompt('Motif de validation (optionnel):');
        
        try {
            const result = await TellusApp.updateDocument('files', fileId, {
                status: 'validated',
                validatedBy: this.agentData.uid,
                validatedAt: new Date().toISOString(),
                validationReason: reason || ''
            });
            
            if (result.success) {
                TellusApp.showSuccess('Dossier validé avec succès');
                TellusApp.closeModal();
            } else {
                TellusApp.showError('Erreur lors de la validation');
            }
        } catch (error) {
            console.error('Error validating file:', error);
            TellusApp.showError('Erreur lors de la validation du dossier');
        }
    },

    // Reject File
    async rejectFile(fileId) {
        const reason = prompt('Motif du rejet (obligatoire):');
        if (!reason) {
            TellusApp.showError('Le motif du rejet est obligatoire');
            return;
        }
        
        try {
            const result = await TellusApp.updateDocument('files', fileId, {
                status: 'rejected',
                rejectedBy: this.agentData.uid,
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason
            });
            
            if (result.success) {
                TellusApp.showSuccess('Dossier rejeté');
                TellusApp.closeModal();
            } else {
                TellusApp.showError('Erreur lors du rejet');
            }
        } catch (error) {
            console.error('Error rejecting file:', error);
            TellusApp.showError('Erreur lors du rejet du dossier');
        }
    },

    // Request Complement
    async requestComplement(fileId) {
        const missingDocs = prompt('Documents manquants (séparés par des virgules):');
        if (!missingDocs) {
            TellusApp.showError('Veuillez spécifier les documents manquants');
            return;
        }

        const reason = prompt('Motif de la demande (optionnel):');
        
        try {
            const result = await TellusApp.updateDocument('files', fileId, {
                status: 'complement_requested',
                missingDocuments: missingDocs.split(',').map(d => d.trim()),
                complementReason: reason || '',
                complementRequestedBy: this.agentData.uid,
                complementRequestedAt: new Date().toISOString()
            });
            
            if (result.success) {
                TellusApp.showSuccess('Demande de complément envoyée');
                TellusApp.closeModal();
            } else {
                TellusApp.showError('Erreur lors de la demande de complément');
            }
        } catch (error) {
            console.error('Error requesting complement:', error);
            TellusApp.showError('Erreur lors de la demande de complément');
        }
    },

    // View Document
    viewDocument: async function(documentId) {
        try {
            const response = await TellusApp.apiCall(`/agent/documents/${documentId}`);
            
            if (response.success) {
                // Open document in new tab or use Capacitor's FileViewer
                if (typeof FileViewer !== 'undefined') {
                    await FileViewer.open({ path: response.document.path });
                } else {
                    window.open(response.document.url, '_blank');
                }
            } else {
                TellusApp.showError('Erreur lors de l\'ouverture du document');
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            TellusApp.showError('Erreur lors de l\'ouverture du document');
        }
    },

    // Load History
    loadHistory: async function() {
        try {
            const response = await TellusApp.apiCall('/agent/history');
            if (response.success) {
                this.history = response.history;
                this.renderHistory();
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    // Render History
    renderHistory: function() {
        const container = document.getElementById('agent-history-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.history.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun historique</p>';
            return;
        }

        this.history.forEach(item => {
            const historyCard = this.createHistoryCard(item);
            container.appendChild(historyCard);
        });
    },

    // Create History Card
    createHistoryCard: function(item) {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        card.innerHTML = `
            <div class="history-header">
                <span class="history-reference">${item.fileReference}</span>
                <span class="history-date">${new Date(item.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="history-body">
                <h4>${item.procedure}</h4>
                <p class="history-action">${item.action}</p>
                <div class="history-ai-score">
                    <span class="score-label">Score IA final:</span>
                    <span class="score-value">${item.aiScore || 0}%</span>
                </div>
            </div>
        `;

        return card;
    },

    // Update Dashboard
    updateDashboard: function() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count today's appointments
        const todayAppointments = this.appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate.getTime() === today.getTime();
        });
        document.getElementById('today-appointments-count').textContent = todayAppointments.length;

        // Count assigned files
        const assignedFiles = this.files.filter(f => 
            f.status === 'submitted' || f.status === 'in_progress'
        );
        document.getElementById('assigned-files-count').textContent = assignedFiles.length;

        // Count pending files
        const pendingFiles = this.files.filter(f => f.status === 'complement_requested');
        document.getElementById('pending-files-count').textContent = pendingFiles.length;
    },

    // Setup Event Listeners
    setupEventListeners: function() {
        // Filter history if needed
        const historyFilters = document.querySelectorAll('.history-filter');
        historyFilters.forEach(filter => {
            filter.addEventListener('change', () => this.filterHistory());
        });
    },

    // Filter History
    filterHistory: function() {
        const dateFilter = document.getElementById('history-date-filter');
        const statusFilter = document.getElementById('history-status-filter');
        const procedureFilter = document.getElementById('history-procedure-filter');

        let filteredHistory = this.history;

        if (dateFilter) {
            // Apply date filter
        }

        if (statusFilter && statusFilter.value !== 'all') {
            filteredHistory = filteredHistory.filter(h => h.status === statusFilter.value);
        }

        if (procedureFilter && procedureFilter.value !== 'all') {
            filteredHistory = filteredHistory.filter(h => h.procedure === procedureFilter.value);
        }

        this.renderFilteredHistory(filteredHistory);
    },

    // Render Filtered History
    renderFilteredHistory: function(filteredHistory) {
        const container = document.getElementById('agent-history-list');
        container.innerHTML = '';

        if (filteredHistory.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun résultat</p>';
            return;
        }

        filteredHistory.forEach(item => {
            const historyCard = this.createHistoryCard(item);
            container.appendChild(historyCard);
        });
    }
};

// Make AgentSpace available globally
window.AgentSpace = AgentSpace;