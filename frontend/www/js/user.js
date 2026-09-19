// TELLUS User Space Module
// Handles all user-related functionality with Firebase

const UserSpace = {
    // User data
    userData: null,
    appointments: [],
    files: [],
    documents: [],
    notifications: [],
    syncListeners: [],

    // Initialize User Space
    async init() {
        console.log('Initializing User Space');
        
        try {
            // Load user data from app state
            this.userData = TellusApp.state.currentUser;
            this.updateProfileUI();
            
            // Setup real-time sync for appointments
            this.setupAppointmentsSync();
            
            // Setup real-time sync for files
            this.setupFilesSync();
            
            // Load documents/procedures
            await this.loadDocuments();
            
            // Setup real-time sync for notifications
            this.setupNotificationsSync();
            
            // Update dashboard
            this.updateDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('User Space initialized successfully');
        } catch (error) {
            console.error('Error initializing User Space:', error);
            TellusApp.showError('Erreur lors du chargement de vos données');
        }
    },

    // Setup Real-time Sync for Appointments
    setupAppointmentsSync() {
        const userId = TellusApp.state.currentUser.uid;
        const listenerId = TellusApp.subscribeToCollection(
            'appointments',
            (appointments) => {
                this.appointments = appointments.filter(a => a.userId === userId);
                this.renderAppointments();
                this.updateDashboard();
            },
            { field: 'userId', operator: '==', value: userId }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Files
    setupFilesSync() {
        const userId = TellusApp.state.currentUser.uid;
        const listenerId = TellusApp.subscribeToCollection(
            'files',
            (files) => {
                this.files = files.filter(f => f.userId === userId);
                this.renderFiles();
                this.updateDashboard();
            },
            { field: 'userId', operator: '==', value: userId }
        );
        
        if (listenerId) {
            this.syncListeners.push(listenerId);
        }
    },

    // Setup Real-time Sync for Notifications
    setupNotificationsSync() {
        const userId = TellusApp.state.currentUser.uid;
        const listenerId = TellusApp.subscribeToCollection(
            'notifications',
            (notifications) => {
                this.notifications = notifications.filter(n => n.userId === userId);
                this.renderNotifications();
            },
            { field: 'userId', operator: '==', value: userId }
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
        if (this.userData) {
            document.getElementById('profile-name').textContent = this.userData.name || '-';
            document.getElementById('profile-name-field').textContent = this.userData.name || '-';
            document.getElementById('profile-email-field').textContent = this.userData.email || '-';
            document.getElementById('profile-phone-field').textContent = this.userData.phone || '-';
        }
    },

    // Load Appointments (now handled by real-time sync)
    async loadAppointments() {
        // This is now handled by setupAppointmentsSync
        // Kept for compatibility
    },

    // Render Appointments
    renderAppointments: function() {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.appointments.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun rendez-vous programmé</p>';
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
        card.className = 'appointment-card';
        
        const date = new Date(appointment.date);
        const formattedDate = date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        card.innerHTML = `
            <div class="appointment-date">
                <span class="date-day">${date.getDate()}</span>
                <span class="date-month">${date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
            </div>
            <div class="appointment-details">
                <h4>${appointment.procedure || 'Rendez-vous'}</h4>
                <p class="appointment-time">${appointment.time}</p>
                <p class="appointment-motif">${appointment.motif || 'Sans motif'}</p>
            </div>
            <div class="appointment-status status-${appointment.status}">
                ${this.getStatusLabel(appointment.status)}
            </div>
        `;

        return card;
    },

    // Get Status Label
    getStatusLabel: function(status) {
        const labels = {
            'confirmed': 'Confirmé',
            'pending': 'En attente',
            'cancelled': 'Annulé',
            'completed': 'Terminé'
        };
        return labels[status] || status;
    },

    // Show New Appointment Modal
    showNewAppointmentModal: function() {
        TellusApp.showModal('new-appointment-modal');
        this.loadProcedureOptions();
    },

    // Load Procedure Options
    loadProcedureOptions: async function() {
        try {
            const response = await TellusApp.apiCall('/procedures');
            if (response.success) {
                const select = document.getElementById('appointment-procedure');
                select.innerHTML = '<option value="">Sélectionnez une procédure</option>';
                
                response.procedures.forEach(procedure => {
                    const option = document.createElement('option');
                    option.value = procedure.id;
                    option.textContent = procedure.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading procedures:', error);
        }
    },

    // Create Appointment
    async createAppointment(formData) {
        try {
            const appointmentData = {
                userId: TellusApp.state.currentUser.uid,
                userName: this.userData.name,
                procedure: formData.procedure,
                date: formData.date,
                time: formData.time,
                motif: formData.motif || '',
                status: 'confirmed'
            };
            
            const result = await TellusApp.addDocument('appointments', appointmentData);
            
            if (result.success) {
                TellusApp.showSuccess('Rendez-vous créé avec succès');
                TellusApp.closeModal();
                
                // Schedule notifications
                this.scheduleAppointmentReminders(appointmentData);
            } else {
                TellusApp.showError('Erreur lors de la création du rendez-vous');
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            TellusApp.showError('Erreur lors de la création du rendez-vous');
        }
    },

    // Schedule Appointment Reminders
    scheduleAppointmentReminders: function(appointment) {
        const appointmentDate = new Date(appointment.date);
        const now = new Date();
        
        // Calculate reminder times: 48h, 24h, 2h before
        const reminderTimes = [
            { hours: 48, message: 'Rappel: Votre rendez-vous est dans 48 heures' },
            { hours: 24, message: 'Rappel: Votre rendez-vous est demain' },
            { hours: 2, message: 'Rappel: Votre rendez-vous est dans 2 heures' }
        ];

        reminderTimes.forEach(reminder => {
            const reminderTime = new Date(appointmentDate.getTime() - reminder.hours * 60 * 60 * 1000);
            if (reminderTime > now) {
                this.scheduleNotification(reminder.message, reminderTime);
            }
        });
    },

    // Schedule Notification
    scheduleNotification: async function(message, date) {
        try {
            if (typeof LocalNotifications !== 'undefined') {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: Date.now(),
                            title: 'TELLUS - Rendez-vous',
                            body: message,
                            schedule: { at: date },
                            sound: 'beep.wav'
                        }
                    ]
                });
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    },

    // Load Files (now handled by real-time sync)
    async loadFiles() {
        // This is now handled by setupFilesSync
        // Kept for compatibility
    },

    // Render Files
    renderFiles: function(subTab = 'in-progress') {
        const container = document.getElementById('files-list');
        if (!container) return;

        container.innerHTML = '';

        let filteredFiles = this.files;
        
        // Filter by sub-tab
        switch (subTab) {
            case 'in-progress':
                filteredFiles = this.files.filter(f => f.status === 'in_progress' || f.status === 'processing');
                break;
            case 'to-complete':
                filteredFiles = this.files.filter(f => f.status === 'complement_requested');
                break;
            case 'completed':
                filteredFiles = this.files.filter(f => f.status === 'validated' || f.status === 'rejected');
                break;
            case 'history':
                // Show all files including delegation history
                filteredFiles = this.files;
                break;
        }

        if (filteredFiles.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun dossier trouvé</p>';
            return;
        }

        filteredFiles.forEach(file => {
            const fileCard = this.createFileCard(file);
            container.appendChild(fileCard);
        });
    },

    // Create File Card
    createFileCard: function(file) {
        const card = document.createElement('div');
        card.className = 'file-card';
        
        // AI Score color
        const scoreColor = this.getScoreColor(file.aiScore);
        
        card.innerHTML = `
            <div class="file-header">
                <span class="file-reference">${file.reference}</span>
                <span class="file-status status-${file.status}">${this.getStatusLabel(file.status)}</span>
            </div>
            <div class="file-body">
                <h4>${file.procedure}</h4>
                <p class="file-date">Déposé le: ${new Date(file.submissionDate).toLocaleDateString('fr-FR')}</p>
                <div class="file-ai-score">
                    <span class="score-label">Score IA:</span>
                    <span class="score-value ${scoreColor}">${file.aiScore || 0}%</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.showFileDetail(file));
        return card;
    },

    // Get Score Color
    getScoreColor: function(score) {
        if (score >= 90) return 'score-green';
        if (score >= 70) return 'score-orange';
        return 'score-red';
    },

    // Show File Detail
    showFileDetail: function(file) {
        // Populate file detail modal
        document.getElementById('file-reference').textContent = file.reference;
        document.getElementById('file-status').textContent = this.getStatusLabel(file.status);
        document.getElementById('file-procedure').textContent = file.procedure;
        document.getElementById('file-date').textContent = new Date(file.submissionDate).toLocaleDateString('fr-FR');
        
        // AI Score
        document.getElementById('ai-completeness-score').textContent = `${file.aiScore || 0}%`;
        document.getElementById('ai-completeness-bar').style.width = `${file.aiScore || 0}%`;
        
        // Show modal
        TellusApp.showModal('file-detail-modal');
    },

    // Load Documents/Procedures
    loadDocuments: async function() {
        try {
            const response = await TellusApp.apiCall('/procedures');
            if (response.success) {
                this.documents = response.procedures;
                this.renderDocuments();
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    },

    // Render Documents
    renderDocuments: function(filter = 'all') {
        const container = document.getElementById('procedures-list');
        if (!container) return;

        container.innerHTML = '';

        let filteredDocuments = this.documents;
        
        if (filter !== 'all') {
            filteredDocuments = this.documents.filter(doc => doc.complexity === filter);
        }

        if (filteredDocuments.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune procédure trouvée</p>';
            return;
        }

        filteredDocuments.forEach(procedure => {
            const procedureCard = this.createProcedureCard(procedure);
            container.appendChild(procedureCard);
        });
    },

    // Create Procedure Card
    createProcedureCard: function(procedure) {
        const card = document.createElement('div');
        card.className = 'procedure-card';
        
        const complexityClass = `complexity-${procedure.complexity}`;
        
        card.innerHTML = `
            <div class="procedure-header">
                <h4>${procedure.name}</h4>
                <span class="complexity-badge ${complexityClass}">${this.getComplexityLabel(procedure.complexity)}</span>
            </div>
            <div class="procedure-body">
                <p class="procedure-description">${procedure.description || ''}</p>
                <div class="procedure-meta">
                    <span class="meta-item">
                        <strong>Délai:</strong> ${procedure.estimatedDelay}
                    </span>
                    <span class="meta-item">
                        <strong>Prix:</strong> ${procedure.estimatedPrice}
                    </span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.showProcedureDetail(procedure));
        return card;
    },

    // Get Complexity Label
    getComplexityLabel: function(complexity) {
        const labels = {
            'easy': 'Facile',
            'medium': 'Moyen',
            'complex': 'Complexe'
        };
        return labels[complexity] || complexity;
    },

    // Show Procedure Detail
    showProcedureDetail: function(procedure) {
        document.getElementById('procedure-detail-title').textContent = procedure.name;
        document.getElementById('procedure-description').textContent = procedure.description || '';
        document.getElementById('procedure-complexity').textContent = this.getComplexityLabel(procedure.complexity);
        document.getElementById('procedure-delay').textContent = procedure.estimatedDelay;
        
        // Render checklist
        this.renderChecklist(procedure.checklist);
        
        // Render price
        this.renderPrice(procedure.price);
        
        TellusApp.showModal('procedure-detail-modal');
    },

    // Render Checklist
    renderChecklist: function(checklist) {
        const container = document.getElementById('procedure-checklist-items');
        container.innerHTML = '';

        checklist.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'checklist-item';
            itemElement.innerHTML = `
                <input type="checkbox" id="checklist-${index}" ${item.required ? 'required' : ''}>
                <label for="checklist-${index}">${item.name}</label>
            `;
            container.appendChild(itemElement);
        });
    },

    // Render Price
    renderPrice: function(price) {
        const container = document.getElementById('procedure-price-items');
        container.innerHTML = '';

        let total = 0;
        price.forEach(item => {
            total += item.amount;
            const itemElement = document.createElement('div');
            itemElement.className = 'price-item';
            itemElement.innerHTML = `
                <span>${item.name}</span>
                <span>${item.amount} FCFA</span>
            `;
            container.appendChild(itemElement);
        });

        document.getElementById('procedure-total-price').textContent = `${total} FCFA`;
    },

    // Load Notifications (now handled by real-time sync)
    async loadNotifications() {
        // This is now handled by setupNotificationsSync
        // Kept for compatibility
    },

    // Render Notifications
    renderNotifications: function() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.notifications.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune notification</p>';
            return;
        }

        this.notifications.forEach(notification => {
            const notificationCard = this.createNotificationCard(notification);
            container.appendChild(notificationCard);
        });
    },

    // Create Notification Card
    createNotificationCard: function(notification) {
        const card = document.createElement('div');
        card.className = `notification-card ${notification.read ? 'read' : 'unread'}`;
        
        card.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-date">${new Date(notification.date).toLocaleDateString('fr-FR')}</span>
            </div>
        `;

        return card;
    },

    // Update Dashboard
    updateDashboard: function() {
        // Count appointments
        const upcomingAppointments = this.appointments.filter(a => 
            new Date(a.date) >= new Date() && a.status === 'confirmed'
        );
        document.getElementById('upcoming-appointments-count').textContent = upcomingAppointments.length;

        // Count files by status
        const inProgressFiles = this.files.filter(f => 
            f.status === 'in_progress' || f.status === 'processing'
        );
        document.getElementById('files-in-progress-count').textContent = inProgressFiles.length;

        const toCompleteFiles = this.files.filter(f => f.status === 'complement_requested');
        document.getElementById('files-to-complete-count').textContent = toCompleteFiles.length;

        const completedFiles = this.files.filter(f => 
            f.status === 'validated' || f.status === 'rejected'
        );
        document.getElementById('files-completed-count').textContent = completedFiles.length;
    },

    // Setup Event Listeners
    setupEventListeners: function() {
        // New appointment form
        const newAppointmentForm = document.getElementById('new-appointment-form');
        if (newAppointmentForm) {
            newAppointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                this.createAppointment(Object.fromEntries(formData));
            });
        }

        // File sub-tabs
        const fileSubTabs = document.querySelectorAll('.files-sub-tab');
        fileSubTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                fileSubTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderFiles(tab.dataset.subTab);
            });
        });

        // Document filters
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.renderDocuments(button.dataset.filter);
            });
        });

        // Document search
        const searchInput = document.getElementById('document-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchDocuments(e.target.value));
        }
    },

    // Search Documents
    searchDocuments: function(query) {
        const container = document.getElementById('procedures-list');
        if (!container) return;

        const filteredDocuments = this.documents.filter(doc => 
            doc.name.toLowerCase().includes(query.toLowerCase()) ||
            doc.description.toLowerCase().includes(query.toLowerCase())
        );

        container.innerHTML = '';
        filteredDocuments.forEach(procedure => {
            const procedureCard = this.createProcedureCard(procedure);
            container.appendChild(procedureCard);
        });
    },

    // Change Password
    changePassword: async function() {
        const oldPassword = prompt('Entrez votre mot de passe actuel:');
        if (!oldPassword) return;

        const newPassword = prompt('Entrez votre nouveau mot de passe:');
        if (!newPassword) return;

        const confirmPassword = prompt('Confirmez votre nouveau mot de passe:');
        if (newPassword !== confirmPassword) {
            TellusApp.showError('Les mots de passe ne correspondent pas');
            return;
        }

        const success = await Auth.changePassword(oldPassword, newPassword);
        if (success) {
            TellusApp.showSuccess('Mot de passe changé avec succès');
        }
    },

    // Manage Biometrics
    manageBiometrics: function() {
        if (typeof Fingerprint !== 'undefined') {
            // Show biometrics management options
            TellusApp.showModal('biometrics-modal');
        } else {
            TellusApp.showError('Biométrie non disponible sur cet appareil');
        }
    },

    // Set Language
    setLanguage: async function(lang) {
        this.state.currentLanguage = lang;
        
        if (typeof I18n !== 'undefined') {
            I18n.setLanguage(lang);
        }

        if (typeof Preferences !== 'undefined') {
            Preferences.set({ key: 'language', value: lang });
        }

        // Update UI
        document.querySelectorAll('.language-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });
    }
};

// Make UserSpace available globally
window.UserSpace = UserSpace;