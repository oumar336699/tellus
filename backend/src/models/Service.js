// TELLUS Service Model
// Mongoose schema for organizational services

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    // Service Information
    name: {
        type: String,
        required: [true, 'Le nom du service est obligatoire'],
        trim: true,
        unique: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    code: {
        type: String,
        required: [true, 'Le code du service est obligatoire'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [10, 'Le code ne peut pas dépasser 10 caractères']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
    },
    
    // Service Type
    type: {
        type: String,
        enum: ['immatriculation', 'mutation', 'morcellement', 'concession', 'contentieux', 'certificat', 'copie'],
        required: [true, 'Le type de service est obligatoire']
    },
    
    // Service Management
    headOfService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        default: null
    },
    
    // Service Capacity
    capacity: {
        dailyFileLimit: {
            type: Number,
            default: 50
        },
        currentLoad: {
            type: Number,
            default: 0
        }
    },
    
    // Service Hours
    workingHours: {
        start: {
            type: String,
            default: '08:00'
        },
        end: {
            type: String,
            default: '16:00'
        },
        workingDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            default: 'monday'
        }]
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Statistics
    stats: {
        totalFilesProcessed: {
            type: Number,
            default: 0
        },
        activeFiles: {
            type: Number,
            default: 0
        },
        averageProcessingTime: {
            type: Number, // in days
            default: 0
        },
        agentCount: {
            type: Number,
            default: 0
        }
    },
    
    // Additional Information
    location: {
        building: String,
        floor: String,
        office: String
    },
    contactInfo: {
        phone: String,
        email: String
    }
}, {
    timestamps: true
});

// Indexes
serviceSchema.index({ code: 1 });
serviceSchema.index({ name: 'text' });
serviceSchema.index({ type: 1 });
serviceSchema.index({ isActive: 1 });

// Virtual for agent count
serviceSchema.virtual('agentCount').get(function() {
    return this.stats.agentCount;
});

// Method to update statistics
serviceSchema.methods.updateStats = async function(statType, value = 1) {
    const updates = {};
    
    switch (statType) {
        case 'file_processed':
            updates['stats.totalFilesProcessed'] = this.stats.totalFilesProcessed + value;
            break;
        case 'active_file':
            updates['stats.activeFiles'] = this.stats.activeFiles + value;
            break;
        case 'completed_file':
            updates['stats.activeFiles'] = Math.max(0, this.stats.activeFiles - value);
            break;
        case 'agent_added':
            updates['stats.agentCount'] = this.stats.agentCount + value;
            break;
        case 'agent_removed':
            updates['stats.agentCount'] = Math.max(0, this.stats.agentCount - value);
            break;
    }
    
    await this.updateOne({ $inc: updates });
};

// Method to check if service can accept more files
serviceSchema.methods.canAcceptFile = function() {
    return this.capacity.currentLoad < this.capacity.dailyFileLimit;
};

// Method to increment current load
serviceSchema.methods.incrementLoad = async function() {
    if (!this.canAcceptFile()) {
        throw new Error('Service capacity reached');
    }
    
    await this.updateOne({
        $inc: { 'capacity.currentLoad': 1 }
    });
};

// Method to decrement current load
serviceSchema.methods.decrementLoad = async function() {
    await this.updateOne({
        $inc: { 'capacity.currentLoad': -1 }
    });
};

// Static method to find active services
serviceSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to find services by type
serviceSchema.statics.findByType = function(type) {
    return this.find({ type, isActive: true });
};

// Static method to find available services (not at capacity)
serviceSchema.statics.findAvailable = function() {
    return this.find({
        isActive: true,
        'capacity.currentLoad': { $lt: '$capacity.dailyFileLimit' }
    });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;