// TELLUS Procedure Model
// Mongoose schema for procedures and document requirements

const mongoose = require('mongoose');

const procedureSchema = new mongoose.Schema({
    // Procedure Information
    name: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: [true, 'Le code est obligatoire'],
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    
    // Procedure Type
    type: {
        type: String,
        enum: ['immatriculation', 'mutation', 'morcellement', 'concession', 'certificat', 'copie'],
        required: [true, 'Le type est obligatoire']
    },
    
    // Complexity
    complexity: {
        type: String,
        enum: ['easy', 'medium', 'complex'],
        required: [true, 'La complexité est obligatoire']
    },
    
    // Processing Information
    estimatedDelay: {
        type: String,
        required: [true, 'Le délai estimé est obligatoire'],
        trim: true
    },
    delayDays: {
        type: Number, // Estimated delay in days
        required: [true, 'Le nombre de jours est obligatoire']
    },
    
    // Cost Information
    price: [{
        name: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: String
    }],
    
    // Required Documents
    requiredDocuments: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        required: {
            type: Boolean,
            default: true
        },
        format: {
            type: String,
            enum: ['original', 'copy', 'certified_copy'],
            default: 'copy'
        }
    }],
    
    // Service Assignment
    defaultService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Additional Information
    legalBasis: String,
    requirements: String,
    notes: String,
    
    // Statistics
    stats: {
        totalFiles: {
            type: Number,
            default: 0
        },
        averageProcessingTime: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes
procedureSchema.index({ code: 1 });
procedureSchema.index({ name: 'text' });
procedureSchema.index({ type: 1 });
procedureSchema.index({ complexity: 1 });
procedureSchema.index({ isActive: 1 });

// Virtual for total price
procedureSchema.virtual('totalPrice').get(function() {
    return this.price.reduce((sum, item) => sum + item.amount, 0);
});

// Method to update statistics
procedureSchema.methods.updateStats = async function(statType, value = 1) {
    const updates = {};
    
    switch (statType) {
        case 'file_created':
            updates['stats.totalFiles'] = this.stats.totalFiles + value;
            break;
    }
    
    await this.updateOne({ $inc: updates });
};

// Static method to find active procedures
procedureSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to find procedures by type
procedureSchema.statics.findByType = function(type) {
    return this.find({ type, isActive: true });
};

// Static method to find procedures by complexity
procedureSchema.statics.findByComplexity = function(complexity) {
    return this.find({ complexity, isActive: true });
};

const Procedure = mongoose.model('Procedure', procedureSchema);

module.exports = Procedure;