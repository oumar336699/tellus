// TELLUS Internationalization Module
// Handles multi-language support (French, English)

const I18n = {
    // Current language
    currentLanguage: 'fr',

    // Translations
    translations: {
        fr: {
            // Common
            loading: 'Chargement...',
            home: 'Accueil',
            confirm: 'Confirmer',
            cancel: 'Annuler',
            save: 'Enregistrer',
            delete: 'Supprimer',
            edit: 'Modifier',
            view: 'Voir',
            search: 'Rechercher',
            filter: 'Filtrer',
            export: 'Exporter',
            import: 'Importer',
            all: 'Tous',
            other: 'Autre',
            back: 'Retour',
            next: 'Suivant',
            previous: 'Précédent',
            close: 'Fermer',
            submit: 'Soumettre',
            logout: 'Déconnexion',
            login: 'Se connecter',
            password: 'Mot de passe',
            username: 'Nom d\'utilisateur',
            name: 'Nom',
            email: 'Email',
            phone: 'Téléphone',
            date: 'Date',
            time: 'Heure',
            status: 'Statut',
            actions: 'Actions',
            details: 'Détails',
            description: 'Description',
            comments: 'Commentaires',
            attachments: 'Pièces jointes',
            download: 'Télécharger',
            upload: 'Téléverser',
            
            // Home screen
            home_subtitle: 'Gestion Foncière',
            user: 'Usager',
            agent: 'Agent',
            super_admin: 'Super Admin',
            region: 'Garoua, Région du Nord, Cameroun',
            
            // Authentication
            user_login: 'Connexion Usager',
            agent_login: 'Connexion Agent',
            admin_login: 'Connexion Super Admin',
            fingerprint: 'Empreinte digitale',
            register_fingerprint: 'Enregistrer empreinte',
            grade: 'Grade',
            cadre: 'Cadre',
            matricule: 'Matricule',
            digital_signature: 'Signature numérique',
            clear: 'Effacer',
            agent_validation: 'Veuillez patienter pendant la validation par le Super Admin',
            
            // Dashboard
            dashboard: 'Tableau de bord',
            upcoming_appointments: 'Rendez-vous à venir',
            files_in_progress: 'Dossiers en cours',
            files_to_complete: 'Dossiers à compléter',
            files_completed: 'Dossiers traités',
            today_appointments: 'RDV du jour',
            assigned_files: 'Dossiers assignés',
            pending_files: 'Dossiers en attente',
            
            // Quick actions
            quick_actions: 'Actions rapides',
            new_appointment: 'Prendre rendez-vous',
            consult_documents: 'Consulter documents',
            
            // Appointments
            appointments: 'Rendez-vous',
            new_appointment: 'Nouveau rendez-vous',
            motif: 'Motif',
            procedure: 'Procédure',
            
            // Files
            my_files: 'Mes dossiers',
            in_progress: 'En cours',
            to_complete: 'À compléter',
            completed: 'Traités',
            history: 'Historique',
            reference: 'Référence',
            submission_date: 'Date de dépôt',
            file_detail: 'Détail du dossier',
            missing_documents: 'Documents manquants',
            
            // Documents
            documents: 'Documents',
            documents_to_provide: 'Documents à fournir',
            required_documents: 'Documents requis',
            estimated_price: 'Prix estimé',
            total: 'Total',
            complexity: 'Complexité',
            estimated_delay: 'Délai estimé',
            easy: 'Facile',
            medium: 'Moyen',
            complex: 'Complexe',
            create_file: 'Créer un dossier',
            book_appointment: 'Prendre rendez-vous',
            download_checklist: 'Télécharger la check-list',
            
            // Notifications
            notifications: 'Notifications',
            
            // Profile
            profile: 'Profil',
            personal_info: 'Informations personnelles',
            security: 'Sécurité',
            change_password: 'Changer le mot de passe',
            manage_biometrics: 'Gérer la biométrie',
            language: 'Langue',
            
            // Agent
            appointments_to_process: 'RDV à traiter',
            land_files: 'Dossiers fonciers',
            agent_info: 'Informations agent',
            service: 'Service',
            
            // Admin
            manage_agents: 'Gestion agents',
            manage_services: 'Gestion services',
            assign_files: 'Assignation dossiers',
            supervision: 'Supervision',
            settings: 'Paramétrage',
            logs: 'Journaux',
            reports: 'Rapports',
            total_files: 'Total dossiers',
            processing_rate: 'Taux de traitement',
            average_delay: 'Délai moyen',
            rejection_rate: 'Taux de rejet',
            service_load: 'Charge par service',
            procedure_types: 'Types de dossiers',
            manage_procedures: 'Gérer les procédures',
            time_slots: 'Créneaux horaires',
            manage_slots: 'Gérer les créneaux',
            workflow: 'Workflow',
            manage_workflow: 'Gérer le workflow',
            all_actions: 'Toutes les actions',
            file_update: 'Mise à jour dossier',
            procedure_change: 'Modification procédure',
            export_pdf: 'Exporter PDF',
            export_excel: 'Exporter Excel',
            monthly_report: 'Rapport mensuel',
            quarterly_report: 'Rapport trimestriel',
            annual_report: 'Rapport annuel',
            
            // AI
            ai_analysis: 'Analyse IA',
            completeness_score: 'Score de complétude',
            
            // Messages
            success_saved: 'Enregistré avec succès',
            error_occurred: 'Une erreur s\'est produite',
            offline_mode: 'Mode hors ligne',
            online_mode: 'Mode en ligne',
            syncing: 'Synchronisation en cours...',
            sync_complete: 'Synchronisation terminée'
        },
        en: {
            // Common
            loading: 'Loading...',
            home: 'Home',
            confirm: 'Confirm',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            view: 'View',
            search: 'Search',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            all: 'All',
            other: 'Other',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            close: 'Close',
            submit: 'Submit',
            logout: 'Logout',
            login: 'Login',
            password: 'Password',
            username: 'Username',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            date: 'Date',
            time: 'Time',
            status: 'Status',
            actions: 'Actions',
            details: 'Details',
            description: 'Description',
            comments: 'Comments',
            attachments: 'Attachments',
            download: 'Download',
            upload: 'Upload',
            
            // Home screen
            home_subtitle: 'Land Management',
            user: 'User',
            agent: 'Agent',
            super_admin: 'Super Admin',
            region: 'Garoua, Northern Region, Cameroon',
            
            // Authentication
            user_login: 'User Login',
            agent_login: 'Agent Login',
            admin_login: 'Super Admin Login',
            fingerprint: 'Fingerprint',
            register_fingerprint: 'Register fingerprint',
            grade: 'Grade',
            cadre: 'Cadre',
            matricule: 'Matricule',
            digital_signature: 'Digital signature',
            clear: 'Clear',
            agent_validation: 'Please wait for Super Admin validation',
            
            // Dashboard
            dashboard: 'Dashboard',
            upcoming_appointments: 'Upcoming appointments',
            files_in_progress: 'Files in progress',
            files_to_complete: 'Files to complete',
            files_completed: 'Completed files',
            today_appointments: 'Today\'s appointments',
            assigned_files: 'Assigned files',
            pending_files: 'Pending files',
            
            // Quick actions
            quick_actions: 'Quick actions',
            new_appointment: 'Book appointment',
            consult_documents: 'Consult documents',
            
            // Appointments
            appointments: 'Appointments',
            new_appointment: 'New appointment',
            motif: 'Reason',
            procedure: 'Procedure',
            
            // Files
            my_files: 'My files',
            in_progress: 'In progress',
            to_complete: 'To complete',
            completed: 'Completed',
            history: 'History',
            reference: 'Reference',
            submission_date: 'Submission date',
            file_detail: 'File detail',
            missing_documents: 'Missing documents',
            
            // Documents
            documents: 'Documents',
            documents_to_provide: 'Documents to provide',
            required_documents: 'Required documents',
            estimated_price: 'Estimated price',
            total: 'Total',
            complexity: 'Complexity',
            estimated_delay: 'Estimated delay',
            easy: 'Easy',
            medium: 'Medium',
            complex: 'Complex',
            create_file: 'Create file',
            book_appointment: 'Book appointment',
            download_checklist: 'Download checklist',
            
            // Notifications
            notifications: 'Notifications',
            
            // Profile
            profile: 'Profile',
            personal_info: 'Personal information',
            security: 'Security',
            change_password: 'Change password',
            manage_biometrics: 'Manage biometrics',
            language: 'Language',
            
            // Agent
            appointments_to_process: 'Appointments to process',
            land_files: 'Land files',
            agent_info: 'Agent information',
            service: 'Service',
            
            // Admin
            manage_agents: 'Manage agents',
            manage_services: 'Manage services',
            assign_files: 'Assign files',
            supervision: 'Supervision',
            settings: 'Settings',
            logs: 'Logs',
            reports: 'Reports',
            total_files: 'Total files',
            processing_rate: 'Processing rate',
            average_delay: 'Average delay',
            rejection_rate: 'Rejection rate',
            service_load: 'Service load',
            procedure_types: 'Procedure types',
            manage_procedures: 'Manage procedures',
            time_slots: 'Time slots',
            manage_slots: 'Manage slots',
            workflow: 'Workflow',
            manage_workflow: 'Manage workflow',
            all_actions: 'All actions',
            file_update: 'File update',
            procedure_change: 'Procedure change',
            export_pdf: 'Export PDF',
            export_excel: 'Export Excel',
            monthly_report: 'Monthly report',
            quarterly_report: 'Quarterly report',
            annual_report: 'Annual report',
            
            // AI
            ai_analysis: 'AI analysis',
            completeness_score: 'Completeness score',
            
            // Messages
            success_saved: 'Saved successfully',
            error_occurred: 'An error occurred',
            offline_mode: 'Offline mode',
            online_mode: 'Online mode',
            syncing: 'Syncing...',
            sync_complete: 'Sync complete'
        }
    },

    // Initialize I18n
    init: function(language = 'fr') {
        this.currentLanguage = language;
        this.updateUI();
    },

    // Set Language
    setLanguage: function(language) {
        this.currentLanguage = language;
        this.updateUI();
    },

    // Get Translation
    t: function(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Fallback to French if translation not found
                value = this.translations['fr'];
                for (const fallbackKey of keys) {
                    if (value && value[fallbackKey]) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return key if not found
                    }
                }
                break;
            }
        }
        
        return value;
    },

    // Update UI
    updateUI: function() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // Update language selector
        document.querySelectorAll('.language-button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.lang === this.currentLanguage) {
                button.classList.add('active');
            }
        });
    },

    // Get Available Languages
    getAvailableLanguages: function() {
        return Object.keys(this.translations);
    },

    // Add Custom Translation
    addTranslation: function(language, key, value) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }

        const keys = key.split('.');
        let obj = this.translations[language];
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
    },

    // Format Date
    formatDate: function(date, format = 'short') {
        const locale = this.currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        
        switch (format) {
            case 'short':
                return new Date(date).toLocaleDateString(locale);
            case 'long':
                return new Date(date).toLocaleDateString(locale, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'time':
                return new Date(date).toLocaleTimeString(locale);
            case 'datetime':
                return new Date(date).toLocaleString(locale);
            default:
                return new Date(date).toLocaleDateString(locale);
        }
    },

    // Format Number
    formatNumber: function(number, decimals = 0) {
        const locale = this.currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    // Format Currency
    formatCurrency: function(amount, currency = 'XAF') {
        const locale = this.currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
};

// Make I18n available globally
window.I18n = I18n;