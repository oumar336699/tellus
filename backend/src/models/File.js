// TELLUS File Model
// Mongoose schema for land registration files

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    // File Reference
    reference: {
        type: String,
        required: [true, 'La référence est obligatoire'],
        unique: true,
        trim: true
    },
    
    // User Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur est obligatoire']
    },
    userName: {
        type: String,
        required: [true, 'Le nom du demandeur est obligatoire'],
        trim: true
    },
    userCNI: {
        type: String,
        trim: true
    },
    
    // Procedure Information
    procedure: {
        type: String,
        required: [true, 'La procédure est obligatoire'],
        trim: true
    },
    procedureType: {
        type: String,
        enum: ['immatriculation', 'mutation', 'morcellement', 'concession', 'certificat', 'copie'],
        required: [true, 'Le type de procédure est obligatoire']
    },
    
    // Assignment
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        default: null
    },
    
    // Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'in_progress', 'complement_requested', 'validated', 'rejected'],
        default: 'draft'
    },
    
    // Documents
    documents: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        },
        verified: {
            type: Boolean,
            default: false
        },
        ocrData: {
            text: String,
            confidence: Number
        }
    }],
    
    // Required Documents Checklist
    requiredDocuments: [{
        name: {
            type: String,
            required: true
        },
        required: {
            type: Boolean,
            default: true
        },
        provided: {
            type: Boolean,
            default: false
        }
    }],
    
    // AI Analysis
    aiAnalysis: {
        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        anomalies: [{
            type: String,
            description: String,
            severity: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        }],
        missingDocuments: [String],
        recommendation: String,
        estimatedDelay: Number, // in days
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        lastAnalysis: {
            type: Date
        }
    },
    
    // Processing Information
    submissionDate: {
        type: Date
    },
    completionDate: {
        type: Date
    },
    processingDays: {
        type: Number
    },
    
    // Complement Request
    complementRequest: {
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agent'
        },
        requestedAt: {
            type: Date
        },
        missingDocuments: [String],
        reason: String,
        deadline: {
            type: Date
        }
    },
    
    // Validation/Rejection
    decision: {
        madeBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agent'
        },
        madeAt: {
            type: Date
        },
        type: {
            type: String,
            enum: ['validated', 'rejected']
        },
        reason: String
    },
    
    // Financial Information
    cost: {
        estimated: {
            type: Number,
            default: 0
        },
        paid: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid'],
            default: 'pending'
        }
    },
    
    // Land Information (if applicable)
    landInfo: {
        location: String,
        surfaceArea: Number, // in square meters
        existingTitle: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    
    // History Tracking
    history: [{
        action: {
            type: String,
            enum: ['created', 'submitted', 'assigned', 'complement_requested', 'complemented', 'validated', 'rejected']
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'userType'
        },
        userType: {
            type: String,
            enum: ['User', 'Agent', 'Admin']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }],
    
    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    // Notes
    notes: [{
        content: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'userType'
        },
        userType: {
            type: String,
            enum: ['User', 'Agent', 'Admin']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
fileSchema.index({ reference: 1 });
fileSchema.index({ user: 1 });
fileSchema.index({ service: 1 });
fileSchema.index({ assignedAgent: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ procedureType: 1 });
fileSchema.index({ submissionDate: 1 });
fileSchema.index({ 'aiAnalysis.score': 1 });
fileSchema.index({ user: 1, status: 1 }); // Compound index for user's files

// Virtual for completion percentage
fileSchema.virtual('completionPercentage').get(function() {
    if (this.requiredDocuments.length === 0) return 100;
    
    const provided = this.requiredDocuments.filter(doc => doc.provided).length;
    return Math.round((provided / this.requiredDocuments.length) * 100);
});

// Virtual for missing documents count
fileSchema.virtual('missingDocumentsCount').get(function() {
    return this.requiredDocuments.filter(doc => doc.required && !doc.provided).length;
});

// Pre-save middleware to generate reference if not provided
fileSchema.pre('save', async function(next) {
    if (!this.reference) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments({
            reference: new RegExp(`^TF-${year}`)
        });
        this.reference = `TF-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculate processing days if file is completed
    if (this.status === 'validated' || this.status === 'rejected') {
        if (this.submissionDate && !this.completionDate) {
            this.completionDate = new Date();
            this.processingDays = Math.ceil(
                (this.completionDate - this.submissionDate) / (1000 * 60 * 60 * 24)
            );
        }
    }
    
    next();
});

// Method to add document
fileSchema.methods.addDocument = async function(documentData) {
    this.documents.push(documentData);
    
    // Update required documents checklist
    const requiredDoc = this.requiredDocuments.find(
        doc => doc.name === documentData.name
    );
    if (requiredDoc) {
        requiredDoc.provided = true;
    }
    
    await this.save();
};

// Method to update AI score
fileSchema.methods.updateAIScore = async function(aiAnalysis) {
    this.aiAnalysis = {
        ...this.aiAnalysis,
        ...aiAnalysis,
        lastAnalysis: new Date()
    };
    await this.save();
};

// Method to add history entry
fileSchema.methods.addHistory = async function(action, performedBy, userType, details = '') {
    this.history.push({
        action,
        performedBy,
        userType,
        details
    });
    await this.save();
};

// Method to assign to service
fileSchema.methods.assignToService = async function(serviceId) {
    this.service = serviceId;
    this.status = 'in_progress';
    await this.addHistory('assigned', serviceId, 'Admin', `Assigned to service ${serviceId}`);
    await this.save();
};

// Method to assign to agent
fileSchema.methods.assignToAgent = async function(agentId) {
    this.assignedAgent = agentId;
    await this.addHistory('assigned', agentId, 'Agent', `Assigned to agent ${agentId}`);
    await this.save();
};

// Method to request complement
fileSchema.methods.requestComplement = async function(agentId, missingDocuments, reason, deadline) {
    this.status = 'complement_requested';
    this.complementRequest = {
        requestedBy: agentId,
        requestedAt: new Date(),
        missingDocuments,
        reason,
        deadline
    };
    await this.addHistory('complement_requested', agentId, 'Agent', reason);
    await this.save();
};

// Method to validate
fileSchema.methods.validate = async function(agentId, reason = '') {
    this.status = 'validated';
    this.decision = {
        madeBy: agentId,
        madeAt: new Date(),
        type: 'validated',
        reason
    };
    await this.addHistory('validated', agentId, 'Agent', reason);
    await this.save();
};

// Method to reject
fileSchema.methods.reject = async function(agentId, reason) {
    this.status = 'rejected';
    this.decision = {
        madeBy: agentId,
        madeAt: new Date(),
        type: 'rejected',
        reason
    };
    await this.addHistory('rejected', agentId, 'Agent', reason);
    await this.save();
};

// Static method to find files by user
fileSchema.statics.findByUser = function(userId) {
    return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find files by service
fileSchema.statics.findByService = function(serviceId) {
    return this.find({ service: serviceId }).sort({ createdAt: -1 });
};

// Static method to find files by agent
fileSchema.statics.findByAgent = function(agentId) {
    return this.find({ assignedAgent: agentId }).sort({ createdAt: -1 });
};

// Static method to find unassigned files
fileSchema.statics.findUnassigned = function() {
    return this.find({ service: null, status: 'submitted' });
};

// Static method to find files by status
fileSchema.statics.findByStatus = function(status) {
    return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get statistics
fileSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgAIScore: { $avg: '$aiAnalysis.score' }
            }
        }
    ]);
    
    return stats.reduce((acc, stat) => {
        acc[stat._id] = {
            count: stat.count,
            avgAIScore: stat.avgAIScore || 0
        };
        return acc;
    }, {});
};

const File = mongoose.model('File', fileSchema);

module.exports = File;