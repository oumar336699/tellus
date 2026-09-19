// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJHzPRsnrblRMgbmQbEuv_8aqPwn7y8zA",
  authDomain: "tellus-app-91481.firebaseapp.com",
  projectId: "tellus-app-91481",
  storageBucket: "tellus-app-91481.firebasestorage.app",
  messagingSenderId: "280129137140",
  appId: "1:280129137140:web:cd75fc9113840deee1b1a1",
  measurementId: "G-VST34G9W08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export Firebase services
export { db, auth, storage, analytics };

// Export Firestore functions
export {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, onSnapshot, orderBy, limit, serverTimestamp
};

// Export Auth functions
export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile
};

// Export Storage functions
export {
  ref, uploadBytes, getDownloadURL, deleteObject
};

// Initialize default collections
export const initializeCollections = async () => {
  try {
    // Users collection
    const usersRef = collection(db, 'users');
    
    // Agents collection
    const agentsRef = collection(db, 'agents');
    
    // Admins collection
    const adminsRef = collection(db, 'admins');
    
    // Services collection
    const servicesRef = collection(db, 'services');
    
    // Files collection
    const filesRef = collection(db, 'files');
    
    // Appointments collection
    const appointmentsRef = collection(db, 'appointments');
    
    // Procedures collection
    const proceduresRef = collection(db, 'procedures');
    
    // Audit logs collection
    const auditLogsRef = collection(db, 'auditLogs');
    
    // Notifications collection
    const notificationsRef = collection(db, 'notifications');
    
    console.log('Firebase collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
    return false;
  }
};

// Real-time sync listeners
const syncListeners = new Map();

export const startRealtimeSync = (collectionName, callback, filter = null) => {
  try {
    let q = collection(db, collectionName);
    
    if (filter) {
      q = query(collection(db, collectionName), where(filter.field, filter.operator, filter.value));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, (error) => {
      console.error(`Real-time sync error for ${collectionName}:`, error);
    });
    
    // Store the unsubscribe function
    const listenerId = `${collectionName}_${Date.now()}`;
    syncListeners.set(listenerId, unsubscribe);
    
    return listenerId;
  } catch (error) {
    console.error('Error starting real-time sync:', error);
    return null;
  }
};

export const stopRealtimeSync = (listenerId) => {
  const unsubscribe = syncListeners.get(listenerId);
  if (unsubscribe) {
    unsubscribe();
    syncListeners.delete(listenerId);
  }
};

export const stopAllSyncListeners = () => {
  syncListeners.forEach((unsubscribe) => {
    unsubscribe();
  });
  syncListeners.clear();
};

// Helper function to add audit log
export const addAuditLog = async (action, userId, userType, details) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      userId,
      userType,
      details,
      timestamp: serverTimestamp(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    });
  } catch (error) {
    console.error('Error adding audit log:', error);
  }
};

// Helper function to send notification
export const sendNotification = async (userId, userType, title, message, type = 'info') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      userType,
      title,
      message,
      type,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
