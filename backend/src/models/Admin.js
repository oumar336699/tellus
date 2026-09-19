// TELLUS Admin Model
// Mongoose schema for Super Admin

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est obligatoire'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
        maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Email invalide'
        ]
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[0-9]{9,15}$/, 'Numéro de téléphone invalide']
    },
    
    // Professional Information
    grade: {
        type: String,
        required: [true, 'Le grade est obligatoire'],
        trim: true
    },
    cadre: {
        type: String,
        required: [true, 'Le cadre est obligatoire'],
        trim: true
    },
    matricule: {
        type: String,
        required: [true, 'Le matricule est obligatoire'],
        unique: true,
        trim: true
    },
    
    // Authentication
    password: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false
    },
    
    // Digital Signature
    signature: {
        type: String, // Base64 encoded signature image
        required: [true, 'La signature est obligatoire']
    },
    signatureVerified: {
        type: Boolean,
        default: false
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Admin Settings
    settings: {
        aiScoreThreshold: {
            type: Number,
            default: 90,
            min: 0,
            max: 100
        },
        aiScoreWarning: {
            type: Number,
            default: 70,
            min: 0,
            max: 100
        },
        enableNotifications: {
            type: Boolean,
            default: true
        },
        enableAuditLogs: {
            type: Boolean,
            default: true
        }
    },
    
    // Permissions (Super Admin has all permissions by default)
    permissions: [{
        type: String,
        enum: [
            'manage_agents',
            'manage_services',
            'assign_files',
            'view_all_files',
            'modify_procedures',
            'view_supervision',
            'manage_settings',
            'view_logs',
            'generate_reports'
        ]
    }],
    
    // Statistics
    stats: {
        agentsValidated: {
            type: Number,
            default: 0
        },
        servicesCreated: {
            type: Number,
            default: 0
        },
        filesAssigned: {
            type: Number,
            default: 0
        },
        settingsModified: {
            type: Number,
            default: 0
        }
    },
    
    // Additional Information
    dateOfBirth: Date,
    dateOfAppointment: Date,
    
    // Preferences
    language: {
        type: String,
        enum: ['fr', 'en'],
        default: 'fr'
    },
    
    // Metadata
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ matricule: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ name: 'text', username: 'text', email: 'text' });

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to verify signature
adminSchema.methods.verifySignature = function(signatureData) {
    // This is a simplified signature verification
    // In production, you would use more sophisticated algorithms
    const crypto = require('crypto');
    
    const currentHash = crypto
        .createHash('sha256')
        .update(this.signature)
        .digest('hex');
    
    const providedHash = crypto
        .createHash('sha256')
        .update(signatureData)
        .digest('hex');
    
    return currentHash === providedHash;
};

// Method to check if account is locked
adminSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
adminSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to generate JWT token
adminSchema.methods.generateToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            id: this._id, 
            type: 'admin',
            username: this.username,
            permissions: this.permissions
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRE || '7d' 
        }
    );
};

// Method to update settings
adminSchema.methods.updateSettings = async function(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.stats.settingsModified = this.stats.settingsModified + 1;
    await this.save();
};

// Static method to find active admin
adminSchema.statics.findActive = function() {
    return this.findOne({ isActive: true });
};

// Static method to check if admin exists
adminSchema.statics.adminExists = function() {
    return this.countDocuments().then(count => count > 0);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;