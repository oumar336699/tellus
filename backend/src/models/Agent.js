// TELLUS Agent Model
// Mongoose schema for agents (employees)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
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
        sparse: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Email invalide'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Le numéro de téléphone est obligatoire'],
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
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    
    // Authentication
    password: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    validatedAt: {
        type: Date
    },
    
    // Permissions
    permissions: [{
        type: String,
        enum: [
            'view_files',
            'process_files',
            'validate_files',
            'reject_files',
            'request_complement',
            'view_appointments',
            'process_appointments',
            'view_history'
        ]
    }],
    
    // Statistics
    stats: {
        filesProcessed: {
            type: Number,
            default: 0
        },
        filesValidated: {
            type: Number,
            default: 0
        },
        filesRejected: {
            type: Number,
            default: 0
        },
        appointmentsProcessed: {
            type: Number,
            default: 0
        },
        averageProcessingTime: {
            type: Number, // in days
            default: 0
        }
    },
    
    // Additional Information
    dateOfBirth: Date,
    dateOfHire: Date,
    
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
agentSchema.index({ username: 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ matricule: 1 });
agentSchema.index({ service: 1 });
agentSchema.index({ status: 1 });
agentSchema.index({ name: 'text', username: 'text', email: 'text' });

// Pre-save middleware to hash password
agentSchema.pre('save', async function(next) {
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
agentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
agentSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
agentSchema.methods.incLoginAttempts = function() {
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
agentSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to generate JWT token
agentSchema.methods.generateToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            id: this._id, 
            type: 'agent',
            username: this.username,
            service: this.service
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRE || '7d' 
        }
    );
};

// Method to update statistics
agentSchema.methods.updateStats = async function(action) {
    const updates = {};
    
    switch (action) {
        case 'file_processed':
            updates['stats.filesProcessed'] = this.stats.filesProcessed + 1;
            break;
        case 'file_validated':
            updates['stats.filesValidated'] = this.stats.filesValidated + 1;
            break;
        case 'file_rejected':
            updates['stats.filesRejected'] = this.stats.filesRejected + 1;
            break;
        case 'appointment_processed':
            updates['stats.appointmentsProcessed'] = this.stats.appointmentsProcessed + 1;
            break;
    }
    
    await this.updateOne({ $inc: updates });
};

// Static method to find agents by service
agentSchema.statics.findByService = function(serviceId) {
    return this.find({ service: serviceId, status: 'active' });
};

// Static method to find pending agents
agentSchema.statics.findPending = function() {
    return this.find({ status: 'pending' });
};

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;