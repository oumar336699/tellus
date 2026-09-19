# Firebase Integration Guide

## Overview
The TELLUS application has been migrated from localStorage to Firebase Firestore for real-time data synchronization across all user spaces (Citizen, Agent, Super Admin).

## What Changed

### 1. Package Dependencies
Added Firebase SDK packages to `frontend/package.json`:
- `firebase`: ^10.7.1
- `@firebase/firestore`: ^4.0.0
- `@firebase/auth`: ^1.6.0
- `@firebase/storage`: ^0.12.0
- `@firebase/analytics`: ^0.10.0

### 2. Firebase Configuration
Created `frontend/www/js/firebase.js` with:
- Firebase initialization with your project configuration
- Firestore database setup
- Authentication setup
- Storage setup
- Real-time sync functions
- Helper functions for audit logs and notifications

### 3. Core Application Changes

#### app.js
- Removed API calls to backend
- Added Firebase initialization
- Added Firebase data operations (add, update, delete, get)
- Added real-time sync subscription functions
- Changed session management to use Firebase Auth

#### auth.js
- Updated authentication to use Firebase Auth
- Added user registration functions
- Added agent registration functions
- Added admin account creation with signature
- Updated login handlers for all user types

#### user.js
- Replaced API calls with Firebase operations
- Added real-time sync for appointments
- Added real-time sync for files
- Added real-time sync for notifications
- Automatic UI updates when data changes

#### agent.js
- Replaced API calls with Firebase operations
- Added real-time sync for appointments
- Added real-time sync for assigned files
- Automatic UI updates when data changes

#### admin.js
- Replaced API calls with Firebase operations
- Added real-time sync for agents
- Added real-time sync for services
- Added real-time sync for unassigned files
- Added real-time sync for audit logs
- Automatic UI updates when data changes

### 4. HTML Changes
Added Firebase SDK imports to `frontend/www/index.html`:
- firebase-app.js
- firebase-auth.js
- firebase-firestore.js
- firebase-storage.js
- firebase-analytics.js

## Firebase Collections

The following collections are automatically created:
- `users` - Citizen accounts
- `agents` - Agent accounts
- `admins` - Super Admin accounts
- `services` - Service definitions
- `files` - Land files
- `appointments` - Appointments
- `procedures` - Procedure definitions
- `auditLogs` - Audit trail
- `notifications` - User notifications

## Real-time Synchronization

### User Space
- Appointments sync automatically when created/modified
- Files sync automatically when status changes
- Notifications sync automatically when received

### Agent Space
- All appointments sync in real-time
- Assigned files sync when service assignments change
- Dashboard updates automatically

### Super Admin Space
- Agent list syncs when agents are added/modified
- Service list syncs when services are added/modified
- Unassigned files sync when files are created/assigned
- Audit logs sync in real-time

## Installation Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Firebase Rules Setup
Make sure your Firebase Firestore rules allow authenticated users to read/write their respective collections. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /agents/{agentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == agentId || 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.matricule != null);
    }
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
    match /services/{serviceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.matricule != null;
    }
    match /files/{fileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /procedures/{procedureId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.matricule != null;
    }
    match /auditLogs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.matricule != null;
      allow write: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Authentication Setup
The application uses Firebase Authentication with email/password:
- Users: `name@tellus.cm`
- Agents: `username@agent.tellus.cm`
- Admins: `matricule@admin.tellus.cm`

### 4. Initial Data Setup
You may need to create initial data:
1. Create the first Super Admin account through the app
2. Create services through the Super Admin space
3. Create procedure definitions through the Super Admin space

## Benefits of Firebase Integration

1. **Real-time Sync**: All changes are immediately visible across all devices
2. **Automatic Offline Support**: Firebase handles offline data automatically
3. **Scalability**: No need to manage backend servers
4. **Security**: Built-in authentication and security rules
5. **Cost-effective**: Generous free tier for development

## Migration Notes

- The backend API is no longer needed for data operations
- All data is now stored in Firebase Firestore
- Authentication is handled by Firebase Auth
- The backend can be kept for AI processing if needed

## Troubleshooting

### Firebase Initialization Errors
- Check that your Firebase project is enabled for Authentication, Firestore, and Storage
- Verify your API keys in `firebase.js`
- Check browser console for specific error messages

### Real-time Sync Not Working
- Verify Firestore rules allow read access
- Check network connectivity
- Ensure user is authenticated

### Authentication Issues
- Verify email format matches the pattern
- Check Firebase Authentication settings
- Ensure user exists in the appropriate collection

## Next Steps

1. Install the Firebase dependencies
2. Configure Firebase Security Rules
3. Test the application with real-time sync
4. Set up initial data (Super Admin, Services, Procedures)
5. Deploy to production

The application is now fully configured for Firebase with automatic real-time synchronization between all user spaces!
