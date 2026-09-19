// TELLUS User Model
// Mongoose schema for regular users (usagers)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
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
    
    // Authentication
    password: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false
    },
    
    // Biometric Data (stored locally on device, not in database)
    fingerprintEnabled: {
        type: Boolean,
        default: false
    },
    
    // Address Information
    address: {
        street: String,
        city: String,
        region: {
            type: String,
            default: 'Nord'
        },
        country: {
            type: String,
            default: 'Cameroun'
        }
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Additional Information
    cniNumber: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    profession: String,
    
    // Preferences
    language: {
        type: String,
        enum: ['fr', 'en'],
        default: 'fr'
    },
    notificationPreferences: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        }
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
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ cniNumber: 1 });
userSchema.index({ name: 'text', email: 'text' });

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
    return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
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
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If have lockUntil and lockUntil has passed, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account if we've reached max attempts and there's no lockUntil
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to generate JWT token
userSchema.methods.generateToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            id: this._id, 
            type: 'user',
            name: this.name 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRE || '7d' 
        }
    );
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier },
            { phone: identifier }
        ]
    });
};

// Static method to find user by CNI
userSchema.statics.findByCNI = function(cniNumber) {
    return this.findOne({ cniNumber });
};

const User = mongoose.model('User', userSchema);

module.exports = User;