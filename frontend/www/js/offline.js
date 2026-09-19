// TELLUS Offline Module
// Handles offline functionality and data synchronization

const OfflineManager = {
    // Offline state
    isOffline: false,
    syncQueue: [],
    syncInProgress: false,

    // Initialize Offline Manager
    init: function() {
        console.log('Initializing Offline Manager');
        this.setupNetworkListeners();
        this.loadSyncQueue();
        this.setupServiceWorker();
    },

    // Setup Network Listeners
    setupNetworkListeners: function() {
        if (typeof Network !== 'undefined') {
            Network.addListener('networkStatusChange', (status) => {
                this.handleNetworkChange(status.connected);
            });
        }

        // Also use browser's online/offline events
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () => this.handleNetworkChange(false));
    },

    // Handle Network Change
    handleNetworkChange: function(isOnline) {
        this.isOffline = !isOnline;
        TellusApp.state.isOnline = isOnline;
        TellusApp.updateNetworkStatusUI();

        if (isOnline && this.syncQueue.length > 0) {
            this.syncData();
        }
    },

    // Setup Service Worker
    setupServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    },

    // Load Sync Queue
    loadSyncQueue: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                const queue = await Preferences.get({ key: 'syncQueue' });
                if (queue.value) {
                    this.syncQueue = JSON.parse(queue.value);
                }
            }
        } catch (error) {
            console.error('Error loading sync queue:', error);
        }
    },

    // Save Sync Queue
    saveSyncQueue: function() {
        if (typeof Preferences !== 'undefined') {
            Preferences.set({
                key: 'syncQueue',
                value: JSON.stringify(this.syncQueue)
            });
        }
    },

    // Add to Sync Queue
    addToSyncQueue: function(action, data) {
        const syncItem = {
            id: Date.now(),
            action,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        };

        this.syncQueue.push(syncItem);
        this.saveSyncQueue();

        TellusApp.showWarning('Action enregistrée pour synchronisation');

        if (!this.isOffline) {
            this.syncData();
        }
    },

    // Sync Data
    async syncData() {
        if (this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        TellusApp.showWarning('Synchronisation en cours...');

        try {
            for (let i = this.syncQueue.length - 1; i >= 0; i--) {
                const syncItem = this.syncQueue[i];
                
                try {
                    await this.processSyncItem(syncItem);
                    this.syncQueue.splice(i, 1);
                } catch (error) {
                    console.error('Sync item failed:', error);
                    syncItem.attempts++;
                    
                    if (syncItem.attempts >= 3) {
                        // Max attempts reached, remove from queue
                        this.syncQueue.splice(i, 1);
                        TellusApp.showError(`Échec de synchronisation après 3 tentatives: ${syncItem.action}`);
                    }
                }
            }

            this.saveSyncQueue();
            TellusApp.showSuccess('Synchronisation terminée');
        } catch (error) {
            console.error('Sync error:', error);
            TellusApp.showError('Erreur lors de la synchronisation');
        } finally {
            this.syncInProgress = false;
        }
    },

    // Process Sync Item
    async processSyncItem(syncItem) {
        switch (syncItem.action) {
            case 'create_appointment':
                return await this.syncAppointment(syncItem.data);
            case 'upload_document':
                return await this.syncDocument(syncItem.data);
            case 'update_file':
                return await this.syncFileUpdate(syncItem.data);
            case 'submit_file':
                return await this.syncFileSubmission(syncItem.data);
            default:
                console.warn('Unknown sync action:', syncItem.action);
        }
    },

    // Sync Appointment
    async syncAppointment(data) {
        const response = await TellusApp.apiCall('/user/appointments', 'POST', data);
        if (!response.success) {
            throw new Error(response.message || 'Sync failed');
        }
        return response;
    },

    // Sync Document
    async syncDocument(data) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        const response = await fetch(`${TellusApp.config.apiBaseUrl}/user/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TellusApp.state.currentUser.token}`
            },
            body: formData
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Sync failed');
        }
        return result;
    },

    // Sync File Update
    async syncFileUpdate(data) {
        const response = await TellusApp.apiCall(`/user/files/${data.fileId}`, 'PUT', data);
        if (!response.success) {
            throw new Error(response.message || 'Sync failed');
        }
        return response;
    },

    // Sync File Submission
    async syncFileSubmission(data) {
        const response = await TellusApp.apiCall(`/user/files/${data.fileId}/submit`, 'POST');
        if (!response.success) {
            throw new Error(response.message || 'Sync failed');
        }
        return response;
    },

    // Cache Data for Offline Use
    cacheData: async function(key, data) {
        try {
            if (typeof Preferences !== 'undefined') {
                await Preferences.set({
                    key: `cache_${key}`,
                    value: JSON.stringify(data)
                });
            }
        } catch (error) {
            console.error('Error caching data:', error);
        }
    },

    // Get Cached Data
    getCachedData: async function(key) {
        try {
            if (typeof Preferences !== 'undefined') {
                const cached = await Preferences.get({ key: `cache_${key}` });
                if (cached.value) {
                    return JSON.parse(cached.value);
                }
            }
        } catch (error) {
            console.error('Error getting cached data:', error);
        }
        return null;
    },

    // Clear Cache
    clearCache: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                const keys = await Preferences.keys();
                for (const key of keys.keys) {
                    if (key.startsWith('cache_')) {
                        await Preferences.remove({ key });
                    }
                }
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    },

    // Check if Data is Fresh
    isDataFresh: async function(key, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        try {
            if (typeof Preferences !== 'undefined') {
                const cached = await Preferences.get({ key: `cache_${key}_timestamp` });
                if (cached.value) {
                    const timestamp = new Date(cached.value);
                    const age = Date.now() - timestamp.getTime();
                    return age < maxAge;
                }
            }
        } catch (error) {
            console.error('Error checking data freshness:', error);
        }
        return false;
    },

    // Set Cache Timestamp
    setCacheTimestamp: async function(key) {
        try {
            if (typeof Preferences !== 'undefined') {
                await Preferences.set({
                    key: `cache_${key}_timestamp`,
                    value: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error setting cache timestamp:', error);
        }
    },

    // Store Offline Action
    storeOfflineAction: function(action, data) {
        if (this.isOffline) {
            this.addToSyncQueue(action, data);
            return true;
        }
        return false;
    },

    // Get Offline Status
    getOfflineStatus: function() {
        return {
            isOffline: this.isOffline,
            pendingSyncItems: this.syncQueue.length,
            syncInProgress: this.syncInProgress
        };
    },

    // Force Sync
    forceSync: function() {
        if (this.isOffline) {
            TellusApp.showError('Impossible de synchroniser en mode hors ligne');
            return;
        }

        if (this.syncQueue.length > 0) {
            this.syncData();
        } else {
            TellusApp.showSuccess('Tout est à jour');
        }
    },

    // Clear Sync Queue
    clearSyncQueue: function() {
        this.syncQueue = [];
        this.saveSyncQueue();
        TellusApp.showSuccess('File de synchronisation vidée');
    }
};

// Make OfflineManager available globally
window.OfflineManager = OfflineManager;