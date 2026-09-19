// TELLUS Authentication Module
// Handles authentication for Users, Agents, and Super Admin with Firebase

const Auth = {
    // Fingerprint state
    fingerprintState: {
        attempts: 0,
        lastAttempt: null,
        isLocked: false
    },

    // Initialize Authentication
    init: function() {
        this.setupFormListeners();
        this.loadFingerprintState();
    },

    // Setup Form Listeners
    setupFormListeners: function() {
        // User Login Form
        const userLoginForm = document.getElementById('user-login-form');
        if (userLoginForm) {
            userLoginForm.addEventListener('submit', (e) => this.handleUserLogin(e));
        }

        // Agent Login Form
        const agentLoginForm = document.getElementById('agent-login-form');
        if (agentLoginForm) {
            agentLoginForm.addEventListener('submit', (e) => this.handleAgentLogin(e));
        }

        // Admin Login Form
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
    },

    // Load Fingerprint State
    loadFingerprintState: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                const state = await Preferences.get({ key: 'fingerprintState' });
                if (state.value) {
                    this.fingerprintState = JSON.parse(state.value);
                    
                    // Check if lockout period has expired
                    if (this.fingerprintState.isLocked) {
                        const lockoutEndTime = this.fingerprintState.lastAttempt + TellusApp.config.fingerprintLockoutTime;
                        if (Date.now() > lockoutEndTime) {
                            this.resetFingerprintState();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading fingerprint state:', error);
        }
    },

    // Save Fingerprint State
    saveFingerprintState: function() {
        if (typeof Preferences !== 'undefined') {
            Preferences.set({
                key: 'fingerprintState',
                value: JSON.stringify(this.fingerprintState)
            });
        }
    },

    // Reset Fingerprint State
    resetFingerprintState: function() {
        this.fingerprintState = {
            attempts: 0,
            lastAttempt: null,
            isLocked: false
        };
        this.saveFingerprintState();
    },

    // Check Fingerprint Capability
    checkFingerprintCapability: async function() {
        try {
            if (typeof Fingerprint !== 'undefined') {
                const result = await Fingerprint.isAvailable();
                if (result.available) {
                    document.getElementById('fingerprint-section').classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error checking fingerprint capability:', error);
        }
    },

    // Register Fingerprint
    registerFingerprint: async function() {
        try {
            if (typeof Fingerprint !== 'undefined') {
                const result = await Fingerprint.register();
                if (result.success) {
                    TellusApp.showSuccess('Empreinte digitale enregistrée avec succès');
                } else {
                    TellusApp.showError('Erreur lors de l\'enregistrement de l\'empreinte');
                }
            }
        } catch (error) {
            console.error('Error registering fingerprint:', error);
            TellusApp.showError('Erreur lors de l\'enregistrement de l\'empreinte');
        }
    },

    // Authenticate with Fingerprint
    authenticateWithFingerprint: async function() {
        try {
            // Check if locked
            if (this.fingerprintState.isLocked) {
                const lockoutEndTime = this.fingerprintState.lastAttempt + TellusApp.config.fingerprintLockoutTime;
                const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 60000);
                TellusApp.showError(`Trop de tentatives. Réessayez dans ${remainingTime} minutes`);
                return false;
            }

            if (typeof Fingerprint !== 'undefined') {
                const result = await Fingerprint.authenticate();
                
                if (result.success) {
                    this.resetFingerprintState();
                    return true;
                } else {
                    this.handleFingerprintFailure();
                    return false;
                }
            }
        } catch (error) {
            console.error('Error authenticating with fingerprint:', error);
            this.handleFingerprintFailure();
            return false;
        }
    },

    // Handle Fingerprint Failure
    handleFingerprintFailure: function() {
        this.fingerprintState.attempts++;
        this.fingerprintState.lastAttempt = Date.now();

        if (this.fingerprintState.attempts >= TellusApp.config.maxFingerprintAttempts) {
            this.fingerprintState.isLocked = true;
            TellusApp.showError('Trop de tentatives. Compte bloqué pour 15 minutes');
        } else {
            const remainingAttempts = TellusApp.config.maxFingerprintAttempts - this.fingerprintState.attempts;
            TellusApp.showError(`Empreinte non reconnue. ${remainingAttempts} tentatives restantes`);
        }

        this.saveFingerprintState();
    },

    // Handle User Login
    async handleUserLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const password = formData.get('password');

        try {
            // Check if fingerprint is required
            const hasFingerprint = !document.getElementById('fingerprint-section').classList.contains('hidden');
            
            if (hasFingerprint) {
                const fingerprintAuth = await this.authenticateWithFingerprint();
                if (!fingerprintAuth) {
                    return;
                }
            }

            // Firebase authentication
            const { signInWithEmailAndPassword } = await import('./firebase.js');
            const email = `${name.toLowerCase().replace(/\s/g, '.')}@tellus.cm`; // Convert name to email
            
            const userCredential = await signInWithEmailAndPassword(TellusApp.state.auth, email, password);
            
            // Get user document from Firestore
            const userDoc = await TellusApp.getDocument('users', userCredential.user.uid);
            
            if (userDoc) {
                TellusApp.state.currentUser = { ...userCredential.user, ...userDoc };
                TellusApp.state.userType = 'user';
                TellusApp.showUserSpace();
                TellusApp.showSuccess('Connexion réussie');
            } else {
                TellusApp.showError('Utilisateur non trouvé');
            }
        } catch (error) {
            console.error('User login error:', error);
            TellusApp.showError('Erreur de connexion. Vérifiez vos identifiants.');
        }
    },

    // Handle Agent Login
    async handleAgentLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            // Firebase authentication
            const { signInWithEmailAndPassword } = await import('./firebase.js');
            const email = `${username}@agent.tellus.cm`;
            
            const userCredential = await signInWithEmailAndPassword(TellusApp.state.auth, email, password);
            
            // Get agent document from Firestore
            const agentDoc = await TellusApp.getDocument('agents', userCredential.user.uid);
            
            if (agentDoc) {
                if (agentDoc.status === 'pending') {
                    // Agent needs validation from Super Admin
                    document.getElementById('agent-validation-message').classList.remove('hidden');
                    TellusApp.showWarning('Votre compte est en attente de validation par le Super Admin');
                } else if (agentDoc.status === 'active') {
                    TellusApp.state.currentUser = { ...userCredential.user, ...agentDoc };
                    TellusApp.state.userType = 'agent';
                    TellusApp.showAgentSpace();
                    TellusApp.showSuccess('Connexion réussie');
                } else {
                    TellusApp.showError('Votre compte est désactivé. Contactez le Super Admin');
                }
            } else {
                TellusApp.showError('Agent non trouvé');
            }
        } catch (error) {
            console.error('Agent login error:', error);
            TellusApp.showError('Erreur de connexion. Vérifiez vos identifiants.');
        }
    },

    // Handle Admin Login
    async handleAdminLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const grade = formData.get('grade');
        const cadre = formData.get('cadre');
        const matricule = formData.get('matricule');
        const password = formData.get('password');

        try {
            // Get signature data
            const signatureData = this.getSignatureData();
            if (!signatureData) {
                TellusApp.showError('Veuillez signer pour continuer');
                return;
            }

            // Firebase authentication
            const { signInWithEmailAndPassword } = await import('./firebase.js');
            const email = `${matricule}@admin.tellus.cm`;
            
            const userCredential = await signInWithEmailAndPassword(TellusApp.state.auth, email, password);
            
            // Get admin document from Firestore
            const adminDoc = await TellusApp.getDocument('admins', userCredential.user.uid);
            
            if (adminDoc) {
                // Verify signature
                if (this.verifySignature(signatureData, adminDoc.signature)) {
                    TellusApp.state.currentUser = { ...userCredential.user, ...adminDoc };
                    TellusApp.state.userType = 'admin';
                    TellusApp.showAdminSpace();
                    TellusApp.showSuccess('Connexion réussie');
                } else {
                    TellusApp.showError('Signature incorrecte');
                }
            } else {
                TellusApp.showError('Admin non trouvé');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            TellusApp.showError('Erreur de connexion. Vérifiez vos identifiants et votre signature.');
        }
    },

    // Verify Signature
    verifySignature(inputSignature, storedSignature) {
        // Simple comparison - in production, use proper signature verification
        return inputSignature === storedSignature;
    },

    // Get Signature Data
    getSignatureData: function() {
        if (typeof SignaturePad !== 'undefined') {
            return SignaturePad.getData();
        }
        return null;
    },

    // Create Super Admin Account (First Time Setup)
    async createAdminAccount(adminData) {
        try {
            const signatureData = this.getSignatureData();
            if (!signatureData) {
                TellusApp.showError('Veuillez signer pour créer le compte');
                return false;
            }

            // Firebase authentication
            const { createUserWithEmailAndPassword } = await import('./firebase.js');
            const email = `${adminData.matricule}@admin.tellus.cm`;
            
            const userCredential = await createUserWithEmailAndPassword(
                TellusApp.state.auth, 
                email, 
                adminData.password
            );
            
            // Create admin document in Firestore
            const adminDoc = {
                name: adminData.name,
                grade: adminData.grade,
                cadre: adminData.cadre,
                matricule: adminData.matricule,
                signature: signatureData,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            const result = await TellusApp.addDocument('admins', adminDoc);
            
            if (result.success) {
                TellusApp.showSuccess('Compte Super Admin créé avec succès');
                return true;
            } else {
                TellusApp.showError('Erreur lors de la création du compte');
                return false;
            }
        } catch (error) {
            console.error('Admin creation error:', error);
            TellusApp.showError('Erreur lors de la création du compte');
            return false;
        }
    },

    // Register User
    async registerUser(userData) {
        try {
            const { createUserWithEmailAndPassword } = await import('./firebase.js');
            const email = `${userData.name.toLowerCase().replace(/\s/g, '.')}@tellus.cm`;
            
            const userCredential = await createUserWithEmailAndPassword(
                TellusApp.state.auth, 
                email, 
                userData.password
            );
            
            // Create user document in Firestore
            const userDoc = {
                name: userData.name,
                email: userData.email || email,
                phone: userData.phone || '',
                address: userData.address || '',
                fingerprintRegistered: false,
                createdAt: new Date().toISOString()
            };
            
            const result = await TellusApp.addDocument('users', userDoc);
            
            if (result.success) {
                TellusApp.showSuccess('Compte créé avec succès');
                return true;
            } else {
                TellusApp.showError('Erreur lors de la création du compte');
                return false;
            }
        } catch (error) {
            console.error('User registration error:', error);
            TellusApp.showError('Erreur lors de la création du compte');
            return false;
        }
    },

    // Register Agent
    async registerAgent(agentData) {
        try {
            const { createUserWithEmailAndPassword } = await import('./firebase.js');
            const email = `${agentData.username}@agent.tellus.cm`;
            
            const userCredential = await createUserWithEmailAndPassword(
                TellusApp.state.auth, 
                email, 
                agentData.password
            );
            
            // Create agent document in Firestore
            const agentDoc = {
                name: agentData.name,
                username: agentData.username,
                service: agentData.service || '',
                status: 'pending', // Requires admin validation
                createdAt: new Date().toISOString()
            };
            
            const result = await TellusApp.addDocument('agents', agentDoc);
            
            if (result.success) {
                TellusApp.showSuccess('Compte agent créé avec succès');
                return true;
            } else {
                TellusApp.showError('Erreur lors de la création du compte');
                return false;
            }
        } catch (error) {
            console.error('Agent registration error:', error);
            TellusApp.showError('Erreur lors de la création du compte');
            return false;
        }
    },

    // Change Password
    changePassword: async function(oldPassword, newPassword) {
        try {
            const response = await TellusApp.apiCall('/auth/change-password', 'POST', {
                oldPassword,
                newPassword
            });

            if (response.success) {
                TellusApp.showSuccess('Mot de passe changé avec succès');
                return true;
            } else {
                TellusApp.showError(response.message || 'Erreur lors du changement de mot de passe');
                return false;
            }
        } catch (error) {
            console.error('Password change error:', error);
            TellusApp.showError('Erreur lors du changement de mot de passe');
            return false;
        }
    },

    // Reset Password (Admin only)
    resetUserPassword: async function(userId) {
        try {
            const response = await TellusApp.apiCall(`/auth/admin/reset-password/${userId}`, 'POST');

            if (response.success) {
                TellusApp.showSuccess('Mot de passe réinitialisé avec succès');
                return true;
            } else {
                TellusApp.showError(response.message || 'Erreur lors de la réinitialisation');
                return false;
            }
        } catch (error) {
            console.error('Password reset error:', error);
            TellusApp.showError('Erreur lors de la réinitialisation du mot de passe');
            return false;
        }
    }
};

// Initialize auth module
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Make auth available globally
window.Auth = Auth;