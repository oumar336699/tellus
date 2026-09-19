// TELLUS Super Admin Space Module
// Handles all Super Admin functionality with Firebase

const AdminSpace = {
    // Admin data
    adminData: null,
    agents: [],
    services: [],
    unassignedFiles: [],
    supervisionData: null,
    logs: [],
    syncListeners: [],

    // Initialize Admin Space
    async init() {
        console.log('Initializing Admin Space');
        
        try {
            // Load admin data from app state
            this.adminData = TellusApp.state.currentUser;
            
            // Setup real-time sync for agents
            this.setupAgentsSync();
            
            // Setup real-time sync for services
            this.setupServicesSync();
            
            // Setup real-time sync for unassigned files
            this.setupUnassignedFilesSync();
            
            // Load supervision data
            await this.loadSupervisionData();
            
            // Setup real-time sync for logs
            this.setupLogsSync();
            
            // Update dashboard
            this.updateDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Admin Space initialized successfully');
        } catch (error) {
            console.error('Error initializing Admin Space:', error);
            TellusApp.showError('Erreur lors du chargement de vos données');
        }
    },

    // Setup Real-time Sync for Agents
    setupAgentsSync() {
        const listenerId = TellusApp.subscribeToCollection(
            'agents',
            (agents) => {
                this.agents = agents;
                this.renderAgents();
            }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Services
    setupServicesSync() {
        const listenerId = TellusApp.subscribeToCollection(
            'services',
            (services) => {
                this.services = services;
                this.renderServices();
            }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Unassigned Files
    setupUnassignedFilesSync() {
        const listenerId = TellusApp.subscribeToCollection(
            'files',
            (files) => {
                this.unassignedFiles = files.filter(f => !f.serviceId);
                this.renderUnassignedFiles();
            }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Logs
    setupLogsSync() {
        const listenerId = TellusApp.subscribeToCollection(
            'auditLogs',
            (logs) => {
                this.logs = logs;
                this.renderLogs();
            }
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

    // Load Agents (now handled by real-time sync)
    async loadAgents() {
        // This is now handled by setupAgentsSync
        // Kept for compatibility
    },

    // Render Agents
    renderAgents: function() {
        const container = document.getElementById('agents-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.agents.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun agent</p>';
            return;
        }

        this.agents.forEach(agent => {
            const agentCard = this.createAgentCard(agent);
            container.appendChild(agentCard);
        });
    },

    // Create Agent Card
    createAgentCard: function(agent) {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        const statusClass = `status-${agent.status}`;
        
        card.innerHTML = `
            <div class="agent-header">
                <h4>${agent.name}</h4>
                <span class="agent-status ${statusClass}">${this.getStatusLabel(agent.status)}</span>
            </div>
            <div class="agent-body">
                <p class="agent-username">@${agent.username}</p>
                <p class="agent-service">Service: ${agent.service || 'Non assigné'}</p>
                <p class="agent-date">Créé le: ${new Date(agent.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="agent-actions">
                ${agent.status === 'pending' ? `
                    <button class="action-button validate-button" onclick="AdminSpace.validateAgent('${agent.id}')">
                        Valider
                    </button>
                    <button class="action-button reject-button" onclick="AdminSpace.rejectAgent('${agent.id}')">
                        Refuser
                    </button>
                ` : `
                    <button class="action-button edit-button" onclick="AdminSpace.editAgent('${agent.id}')">
                        Modifier
                    </button>
                    <button class="action-button delete-button" onclick="AdminSpace.deleteAgent('${agent.id}')">
                        Supprimer
                    </button>
                `}
            </div>
        `;

        return card;
    },

    // Get Status Label
    getStatusLabel: function(status) {
        const labels = {
            'pending': 'En attente',
            'active': 'Actif',
            'inactive': 'Inactif'
        };
        return labels[status] || status;
    },

    // Validate Agent
    async validateAgent(agentId) {
        try {
            const result = await TellusApp.updateDocument('agents', agentId, {
                status: 'active',
                validatedBy: this.adminData.uid,
                validatedAt: new Date().toISOString()
            });
            
            if (result.success) {
                TellusApp.showSuccess('Agent validé avec succès');
            } else {
                TellusApp.showError('Erreur lors de la validation');
            }
        } catch (error) {
            console.error('Error validating agent:', error);
            TellusApp.showError('Erreur lors de la validation de l\'agent');
        }
    },

    // Reject Agent
    async rejectAgent(agentId) {
        const reason = prompt('Motif du refus (optionnel):');
        
        try {
            const result = await TellusApp.updateDocument('agents', agentId, {
                status: 'rejected',
                rejectionReason: reason || '',
                rejectedBy: this.adminData.uid,
                rejectedAt: new Date().toISOString()
            });
            
            if (result.success) {
                TellusApp.showSuccess('Agent rejeté');
            } else {
                TellusApp.showError('Erreur lors du rejet');
            }
        } catch (error) {
            console.error('Error rejecting agent:', error);
            TellusApp.showError('Erreur lors du rejet de l\'agent');
        }
    },

    // Edit Agent
    editAgent: function(agentId) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) return;

        // Show edit modal
        TellusApp.showModal('edit-agent-modal');
        this.populateEditAgentForm(agent);
    },

    // Populate Edit Agent Form
    populateEditAgentForm: function(agent) {
        document.getElementById('edit-agent-name').value = agent.name;
        document.getElementById('edit-agent-username').value = agent.username;
        document.getElementById('edit-agent-service').value = agent.service || '';
    },

    // Delete Agent
    async deleteAgent(agentId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
            return;
        }

        try {
            const result = await TellusApp.deleteDocument('agents', agentId);
            
            if (result.success) {
                TellusApp.showSuccess('Agent supprimé');
            } else {
                TellusApp.showError('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting agent:', error);
            TellusApp.showError('Erreur lors de la suppression de l\'agent');
        }
    },

    // Show Add Agent Modal
    showAddAgentModal() {
        TellusApp.showModal('add-agent-modal');
    },

    // Add Agent
    async addAgent(formData) {
        try {
            const result = await Auth.registerAgent(formData);
            
            if (result) {
                TellusApp.closeModal();
            }
        } catch (error) {
            console.error('Error adding agent:', error);
            TellusApp.showError('Erreur lors de l\'ajout de l\'agent');
        }
    },

    // Load Services (now handled by real-time sync)
    async loadServices() {
        // This is now handled by setupServicesSync
        // Kept for compatibility
    },

    // Render Services
    renderServices: function() {
        const container = document.getElementById('services-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.services.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun service</p>';
            return;
        }

        this.services.forEach(service => {
            const serviceCard = this.createServiceCard(service);
            container.appendChild(serviceCard);
        });
    },

    // Create Service Card
    createServiceCard: function(service) {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        card.innerHTML = `
            <div class="service-header">
                <h4>${service.name}</h4>
                <span class="service-agents-count">${service.agentCount || 0} agents</span>
            </div>
            <div class="service-body">
                <p class="service-description">${service.description || ''}</p>
                <p class="service-files-count">Dossiers en cours: ${service.activeFiles || 0}</p>
            </div>
            <div class="service-actions">
                <button class="action-button edit-button" onclick="AdminSpace.editService('${service.id}')">
                    Modifier
                </button>
                <button class="action-button delete-button" onclick="AdminSpace.deleteService('${service.id}')">
                    Supprimer
                </button>
            </div>
        `;

        return card;
    },

    // Show Add Service Modal
    showAddServiceModal() {
        TellusApp.showModal('add-service-modal');
    },

    // Add Service
    async addService(formData) {
        try {
            const serviceData = {
                name: formData.name,
                description: formData.description || '',
                agentCount: 0,
                activeFiles: 0,
                createdAt: new Date().toISOString()
            };
            
            const result = await TellusApp.addDocument('services', serviceData);
            
            if (result.success) {
                TellusApp.showSuccess('Service ajouté avec succès');
                TellusApp.closeModal();
            } else {
                TellusApp.showError('Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Error adding service:', error);
            TellusApp.showError('Erreur lors de l\'ajout du service');
        }
    },

    // Edit Service
    editService: function(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        TellusApp.showModal('edit-service-modal');
        this.populateEditServiceForm(service);
    },

    // Populate Edit Service Form
    populateEditServiceForm: function(service) {
        document.getElementById('edit-service-name').value = service.name;
        document.getElementById('edit-service-description').value = service.description || '';
    },

    // Delete Service
    async deleteService(serviceId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            return;
        }

        try {
            const result = await TellusApp.deleteDocument('services', serviceId);
            
            if (result.success) {
                TellusApp.showSuccess('Service supprimé');
            } else {
                TellusApp.showError('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            TellusApp.showError('Erreur lors de la suppression du service');
        }
    },

    // Load Unassigned Files (now handled by real-time sync)
    async loadUnassignedFiles() {
        // This is now handled by setupUnassignedFilesSync
        // Kept for compatibility
    },

    // Render Unassigned Files
    renderUnassignedFiles: function() {
        const container = document.getElementById('assignment-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.unassignedFiles.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun dossier à assigner</p>';
            return;
        }

        this.unassignedFiles.forEach(file => {
            const fileCard = this.createAssignmentCard(file);
            container.appendChild(fileCard);
        });
    },

    // Create Assignment Card
    createAssignmentCard: function(file) {
        const card = document.createElement('div');
        card.className = 'assignment-card';
        
        card.innerHTML = `
            <div class="assignment-header">
                <span class="file-reference">${file.reference}</span>
                <span class="file-procedure">${file.procedure}</span>
            </div>
            <div class="assignment-body">
                <p class="file-user">Demandeur: ${file.userName || 'Non spécifié'}</p>
                <p class="file-date">Déposé le: ${new Date(file.submissionDate).toLocaleDateString('fr-FR')}</p>
                <div class="file-ai-score">
                    <span class="score-label">Score IA:</span>
                    <span class="score-value">${file.aiScore || 0}%</span>
                </div>
            </div>
            <div class="assignment-actions">
                <select class="service-select" id="service-select-${file.id}">
                    <option value="">Sélectionnez un service</option>
                    ${this.services.map(service => 
                        `<option value="${service.id}">${service.name}</option>`
                    ).join('')}
                </select>
                <button class="action-button assign-button" onclick="AdminSpace.assignFile('${file.id}')">
                    Assigner
                </button>
            </div>
        `;

        return card;
    },

    // Assign File
    async assignFile(fileId) {
        const serviceSelect = document.getElementById(`service-select-${fileId}`);
        const serviceId = serviceSelect.value;

        if (!serviceId) {
            TellusApp.showError('Veuillez sélectionner un service');
            return;
        }

        try {
            const result = await TellusApp.updateDocument('files', fileId, {
                serviceId: serviceId,
                assignedBy: this.adminData.uid,
                assignedAt: new Date().toISOString()
            });
            
            if (result.success) {
                TellusApp.showSuccess('Dossier assigné avec succès');
            } else {
                TellusApp.showError('Erreur lors de l\'assignation');
            }
        } catch (error) {
            console.error('Error assigning file:', error);
            TellusApp.showError('Erreur lors de l\'assignation du dossier');
        }
    },

    // Load Supervision Data
    loadSupervisionData: async function() {
        try {
            const response = await TellusApp.apiCall('/admin/supervision');
            if (response.success) {
                this.supervisionData = response.data;
                this.renderSupervisionData();
            }
        } catch (error) {
            console.error('Error loading supervision data:', error);
        }
    },

    // Render Supervision Data
    renderSupervisionData: function() {
        if (!this.supervisionData) return;

        // Update statistics
        document.getElementById('total-files-stat').textContent = this.supervisionData.totalFiles || 0;
        document.getElementById('processing-rate-stat').textContent = `${this.supervisionData.processingRate || 0}%`;
        document.getElementById('average-delay-stat').textContent = `${this.supervisionData.averageDelay || 0} jours`;
        document.getElementById('rejection-rate-stat').textContent = `${this.supervisionData.rejectionRate || 0}%`;

        // Render AI score statistics
        this.renderAIScoreStatistics();
    },

    // Render AI Score Statistics
    renderAIScoreStatistics: function() {
        if (!this.supervisionData || !this.supervisionData.aiScoreStats) return;

        const stats = this.supervisionData.aiScoreStats;
        
        // Create AI score statistics section
        const supervisionContainer = document.querySelector('.admin-supervision-container');
        
        const aiStatsSection = document.createElement('div');
        aiStatsSection.className = 'ai-score-statistics';
        
        aiStatsSection.innerHTML = `
            <h3>Statistiques du Score IA</h3>
            <div class="ai-stats-grid">
                <div class="ai-stat-card">
                    <h4>Score moyen</h4>
                    <p class="stat-number">${stats.averageScore || 0}%</p>
                </div>
                <div class="ai-stat-card">
                    <h4>Taux de dossiers conformes (≥90%)</h4>
                    <p class="stat-number">${stats.compliantRate || 0}%</p>
                </div>
                <div class="ai-stat-card">
                    <h4>Taux de dossiers à compléter (70-89%)</h4>
                    <p class="stat-number">${stats.warningRate || 0}%</p>
                </div>
                <div class="ai-stat-card">
                    <h4>Taux de rejet IA (<70%)</h4>
                    <p class="stat-number">${stats.rejectionRate || 0}%</p>
                </div>
            </div>
            <div class="missing-documents-top">
                <h4>Pièces les plus souvent manquantes</h4>
                <ul>
                    ${(stats.missingDocuments || []).map((doc, index) => 
                        `<li>${index + 1}. ${doc.name} (${doc.count} fois)</li>`
                    ).join('')}
                </ul>
            </div>
        `;

        supervisionContainer.appendChild(aiStatsSection);
    },

    // Load Logs (now handled by real-time sync)
    async loadLogs() {
        // This is now handled by setupLogsSync
        // Kept for compatibility
    },

    // Render Logs
    renderLogs: function() {
        const container = document.getElementById('logs-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.logs.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun journal</p>';
            return;
        }

        this.logs.forEach(log => {
            const logCard = this.createLogCard(log);
            container.appendChild(logCard);
        });
    },

    // Create Log Card
    createLogCard: function(log) {
        const card = document.createElement('div');
        card.className = 'log-card';
        
        card.innerHTML = `
            <div class="log-header">
                <span class="log-action">${log.action}</span>
                <span class="log-date">${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
            </div>
            <div class="log-body">
                <p class="log-user">Utilisateur: ${log.userName || 'Système'}</p>
                <p class="log-details">${log.details || ''}</p>
            </div>
        `;

        return card;
    },

    // Filter Logs
    filterLogs: function() {
        const dateFrom = document.getElementById('log-date-from').value;
        const dateTo = document.getElementById('log-date-to').value;
        const actionType = document.getElementById('log-action-type').value;

        let filteredLogs = this.logs;

        if (dateFrom) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= new Date(dateTo)
            );
        }

        if (actionType !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.action === actionType);
        }

        this.renderFilteredLogs(filteredLogs);
    },

    // Render Filtered Logs
    renderFilteredLogs: function(filteredLogs) {
        const container = document.getElementById('logs-list');
        container.innerHTML = '';

        if (filteredLogs.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun résultat</p>';
            return;
        }

        filteredLogs.forEach(log => {
            const logCard = this.createLogCard(log);
            container.appendChild(logCard);
        });
    },

    // Export Logs
    exportLogs: async function(format) {
        try {
            const response = await TellusApp.apiCall(`/admin/logs/export/${format}`, 'POST', {
                filters: {
                    dateFrom: document.getElementById('log-date-from').value,
                    dateTo: document.getElementById('log-date-to').value,
                    actionType: document.getElementById('log-action-type').value
                }
            });

            if (response.success) {
                // Download the file
                if (format === 'pdf') {
                    window.open(response.downloadUrl, '_blank');
                } else {
                    // For Excel, download the file
                    const link = document.createElement('a');
                    link.href = response.downloadUrl;
                    link.download = `logs_${new Date().toISOString()}.${format}`;
                    link.click();
                }
                
                TellusApp.showSuccess('Export réussi');
            } else {
                TellusApp.showError(response.message || 'Erreur lors de l\'export');
            }
        } catch (error) {
            console.error('Error exporting logs:', error);
            TellusApp.showError('Erreur lors de l\'export des journaux');
        }
    },

    // Generate Report
    generateReport: async function(type) {
        try {
            const response = await TellusApp.apiCall(`/admin/reports/${type}`, 'POST');

            if (response.success) {
                TellusApp.showSuccess('Rapport généré avec succès');
                // Download or display the report
                window.open(response.reportUrl, '_blank');
            } else {
                TellusApp.showError(response.message || 'Erreur lors de la génération du rapport');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            TellusApp.showError('Erreur lors de la génération du rapport');
        }
    },

    // Update Settings
    updateSettings: async function(settings) {
        try {
            const response = await TellusApp.apiCall('/admin/settings', 'POST', settings);

            if (response.success) {
                TellusApp.showSuccess('Paramètres mis à jour avec succès');
                TellusApp.closeModal();
            } else {
                TellusApp.showError(response.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            TellusApp.showError('Erreur lors de la mise à jour des paramètres');
        }
    },

    // Update Dashboard
    updateDashboard: function() {
        // Update supervision dashboard
        if (this.supervisionData) {
            this.renderSupervisionData();
        }
    },

    // Setup Event Listeners
    setupEventListeners: function() {
        // Add agent form
        const addAgentForm = document.getElementById('add-agent-form');
        if (addAgentForm) {
            addAgentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                this.addAgent(Object.fromEntries(formData));
            });
        }

        // Add service form
        const addServiceForm = document.getElementById('add-service-form');
        if (addServiceForm) {
            addServiceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                this.addService(Object.fromEntries(formData));
            });
        }

        // Log filters
        const filterButton = document.querySelector('.log-filters .filter-button');
        if (filterButton) {
            filterButton.addEventListener('click', () => this.filterLogs());
        }
    }
};

// Make AdminSpace available globally
window.AdminSpace = AdminSpace;