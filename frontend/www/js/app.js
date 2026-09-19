// TELLUS Application - Main JavaScript File
// Version 2.0 - Gestion Foncière Mobile App with Firebase

const TellusApp = {
    // Application State
    state: {
        currentUser: null,
        userType: null, // 'user', 'agent', 'admin'
        currentLanguage: 'fr',
        isOnline: true,
        isLoading: true,
        db: null,
        auth: null,
        storage: null
    },

    // Configuration
    config: {
        aiScoreThreshold: 90, // Score minimum pour soumettre un dossier
        aiScoreWarning: 70, // Score d'alerte
        maxFingerprintAttempts: 3,
        fingerprintLockoutTime: 15 * 60 * 1000 // 15 minutes
    },

    // Initialize Application
    async init() {
        console.log('TELLUS App - Initialization');
        
        try {
            // Check network status
            this.checkNetworkStatus();
            
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Load saved preferences
            await this.loadPreferences();
            
            // Initialize i18n
            if (typeof I18n !== 'undefined') {
                I18n.init(this.state.currentLanguage);
            }
            
            // Initialize offline support
            if (typeof OfflineManager !== 'undefined') {
                OfflineManager.init();
            }
            
            // Check for existing session
            await this.checkExistingSession();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('TELLUS App - Initialized successfully');
        } catch (error) {
            console.error('TELLUS App - Initialization error:', error);
            this.showError('Erreur lors de l\'initialisation de l\'application');
        }
    },

    // Initialize Firebase
    async initializeFirebase() {
        try {
            // Dynamically import Firebase
            const firebaseModule = await import('./firebase.js');
            
            this.state.db = firebaseModule.db;
            this.state.auth = firebaseModule.auth;
            this.state.storage = firebaseModule.storage;
            
            // Initialize Firebase collections
            await firebaseModule.initializeCollections();
            
            // Setup auth state listener
            this.setupAuthListener();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    },

    // Setup Auth Listener
    setupAuthListener() {
        if (this.state.auth) {
            this.state.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in
                    const userDoc = await this.getUserDocument(user.uid);
                    if (userDoc) {
                        this.state.currentUser = { ...user, ...userDoc };
                        this.state.userType = userDoc.userType;
                        
                        // Restore appropriate space
                        switch (this.state.userType) {
                            case 'user':
                                this.showUserSpace();
                                break;
                            case 'agent':
                                this.showAgentSpace();
                                break;
                            case 'admin':
                                this.showAdminSpace();
                                break;
                        }
                    }
                } else {
                    // User is signed out
                    this.state.currentUser = null;
                    this.state.userType = null;
                    this.showHome();
                }
            });
        }
    },

    // Get User Document from Firestore
    async getUserDocument(userId) {
        try {
            if (!this.state.db) return null;
            
            // Try to get user document from users collection
            let userDoc = await this.getDocument('users', userId);
            if (userDoc) return { ...userDoc, userType: 'user' };
            
            // Try agents collection
            userDoc = await this.getDocument('agents', userId);
            if (userDoc) return { ...userDoc, userType: 'agent' };
            
            // Try admins collection
            userDoc = await this.getDocument('admins', userId);
            if (userDoc) return { ...userDoc, userType: 'admin' };
            
            return null;
        } catch (error) {
            console.error('Error getting user document:', error);
            return null;
        }
    },

    // Get Document from Firestore
    async getDocument(collectionName, docId) {
        try {
            const { doc, getDoc } = await import('./firebase.js');
            const docRef = doc(this.state.db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting document:', error);
            return null;
        }
    },

    // Check Network Status
    checkNetworkStatus: function() {
        if (typeof Network !== 'undefined') {
            Network.getStatus().then(status => {
                this.state.isOnline = status.connected;
                this.updateNetworkStatusUI();
            });
        }
    },

    // Update Network Status UI
    updateNetworkStatusUI: function() {
        const statusIndicator = document.getElementById('network-status');
        if (statusIndicator) {
            statusIndicator.className = this.state.isOnline ? 'online' : 'offline';
            statusIndicator.textContent = this.state.isOnline ? 'En ligne' : 'Hors ligne';
        }
    },

    // Load User Preferences
    loadPreferences: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                const language = await Preferences.get({ key: 'language' });
                if (language.value) {
                    this.state.currentLanguage = language.value;
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    },

    // Check for Existing Session
    async checkExistingSession() {
        try {
            // Firebase auth listener handles this automatically
            // This method is kept for compatibility but doesn't do much
            if (!this.state.currentUser) {
                this.showHome();
            }
        } catch (error) {
            console.error('Error checking session:', error);
            this.showHome();
        }
    },

    // Setup Event Listeners
    setupEventListeners: function() {
        // Network status changes
        if (typeof Network !== 'undefined') {
            Network.addListener('networkStatusChange', (status) => {
                this.state.isOnline = status.connected;
                this.updateNetworkStatusUI();
            });
        }

        // Handle back button
        document.addEventListener('backbutton', (e) => {
            this.handleBackButton(e);
        }, false);
    },

    // Handle Back Button
    handleBackButton: function(e) {
        const currentScreen = this.getCurrentScreen();
        
        if (currentScreen !== 'home-screen') {
            e.preventDefault();
            this.showHome();
        } else {
            // Exit app on home screen
            navigator.app.exitApp();
        }
    },

    // Get Current Screen
    getCurrentScreen: function() {
        const screens = document.querySelectorAll('.screen');
        for (const screen of screens) {
            if (!screen.classList.contains('hidden')) {
                return screen.id;
            }
        }
        return null;
    },

    // Screen Navigation
    showHome: function() {
        this.hideAllScreens();
        document.getElementById('home-screen').classList.remove('hidden');
    },

    showUserLogin: function() {
        this.hideAllScreens();
        document.getElementById('user-login-screen').classList.remove('hidden');
        // Check for fingerprint capability
        this.checkFingerprintCapability();
    },

    showAgentLogin: function() {
        this.hideAllScreens();
        document.getElementById('agent-login-screen').classList.remove('hidden');
    },

    showAdminLogin: function() {
        this.hideAllScreens();
        document.getElementById('admin-login-screen').classList.remove('hidden');
        // Initialize signature pad
        if (typeof SignaturePad !== 'undefined') {
            SignaturePad.init();
        }
    },

    showUserSpace: function() {
        this.hideAllScreens();
        document.getElementById('user-space').classList.remove('hidden');
        // Load user data
        if (typeof UserSpace !== 'undefined') {
            UserSpace.init();
        }
    },

    showAgentSpace: function() {
        this.hideAllScreens();
        document.getElementById('agent-space').classList.remove('hidden');
        // Load agent data
        if (typeof AgentSpace !== 'undefined') {
            AgentSpace.init();
        }
    },

    showAdminSpace: function() {
        this.hideAllScreens();
        document.getElementById('admin-space').classList.remove('hidden');
        // Load admin data
        if (typeof AdminSpace !== 'undefined') {
            AdminSpace.init();
        }
    },

    hideAllScreens: function() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
    },

    // Loading Screen
    hideLoadingScreen: function() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        this.state.isLoading = false;
    },

    // Modal Management
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modal-overlay');
        if (modal && overlay) {
            modal.classList.remove('hidden');
            overlay.classList.remove('hidden');
        }
    },

    closeModal: function() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        modals.forEach(modal => modal.classList.add('hidden'));
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },

    // Toast Notifications
    showToast: function(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Error Handling
    showError: function(message) {
        this.showToast(message, 'error', 5000);
    },

    showSuccess: function(message) {
        this.showToast(message, 'success', 3000);
    },

    showWarning: function(message) {
        this.showToast(message, 'warning', 4000);
    },

    // Tab Navigation
    switchTab: function(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });

        // Update tab panes
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.add('hidden');
            pane.classList.remove('active');
        });

        const activePane = document.getElementById(`tab-${tabName}`);
        if (activePane) {
            activePane.classList.remove('hidden');
            activePane.classList.add('active');
        }
    },

    // Firebase Data Operations
    async addDocument(collectionName, data) {
        try {
            const { addDoc, collection, serverTimestamp } = await import('./firebase.js');
            const docRef = await addDoc(collection(this.state.db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding document:', error);
            return { success: false, error: error.message };
        }
    },

    async updateDocument(collectionName, docId, data) {
        try {
            const { updateDoc, doc, serverTimestamp } = await import('./firebase.js');
            await updateDoc(doc(this.state.db, collectionName, docId), {
                ...data,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteDocument(collectionName, docId) {
        try {
            const { deleteDoc, doc } = await import('./firebase.js');
            await deleteDoc(doc(this.state.db, collectionName, docId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    },

    async getCollection(collectionName, filter = null) {
        try {
            const { collection, getDocs, query, where, orderBy } = await import('./firebase.js');
            let q = collection(this.state.db, collectionName);
            
            if (filter) {
                q = query(collection(this.state.db, collectionName), where(filter.field, filter.operator, filter.value));
            }
            
            const querySnapshot = await getDocs(q);
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: documents };
        } catch (error) {
            console.error('Error getting collection:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    // Real-time sync for specific collection
    subscribeToCollection(collectionName, callback, filter = null) {
        try {
            const { startRealtimeSync } = require('./firebase.js');
            const listenerId = startRealtimeSync(collectionName, callback, filter);
            return listenerId;
        } catch (error) {
            console.error('Error subscribing to collection:', error);
            return null;
        }
    },

    // Unsubscribe from collection
    unsubscribeFromCollection(listenerId) {
        try {
            const { stopRealtimeSync } = require('./firebase.js');
            stopRealtimeSync(listenerId);
        } catch (error) {
            console.error('Error unsubscribing from collection:', error);
        }
    },

    // Session Management
    saveSession: function(user, userType) {
        const sessionData = {
            user: user,
            userType: userType,
            timestamp: new Date().toISOString()
        };

        if (typeof Preferences !== 'undefined') {
            Preferences.set({
                key: 'session',
                value: JSON.stringify(sessionData)
            });
        }

        this.state.currentUser = user;
        this.state.userType = userType;
    },

    clearSession: function() {
        if (typeof Preferences !== 'undefined') {
            Preferences.remove({ key: 'session' });
        }

        this.state.currentUser = null;
        this.state.userType = null;
    },

    // Logout
    logout: function() {
        this.clearSession();
        this.showHome();
        this.showSuccess('Déconnexion réussie');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    TellusApp.init();
});

// Make app available globally
window.TellusApp = TellusApp;