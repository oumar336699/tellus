// TELLUS Appointment Model
// Mongoose schema for appointments

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // User Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur est obligatoire']
    },
    userName: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true
    },
    
    // Appointment Details
    date: {
        type: Date,
        required: [true, 'La date est obligatoire']
    },
    time: {
        type: String,
        required: [true, 'L\'heure est obligatoire'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)']
    },
    procedure: {
        type: String,
        required: [true, 'La procédure est obligatoire'],
        trim: true
    },
    motif: {
        type: String,
        trim: true,
        maxlength: [500, 'Le motif ne peut pas dépasser 500 caractères']
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
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'pending'
    },
    
    // Processing Information
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        default: null
    },
    processedAt: {
        type: Date
    },
    
    // Reminders
    remindersSent: [{
        type: String,
        enum: ['48h', '24h', '2h'],
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],
    
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
    }],
    
    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    }
}, {
    timestamps: true
});

// Indexes
appointmentSchema.index({ user: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ service: 1 });
appointmentSchema.index({ assignedAgent: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ user: 1, date: 1 }); // Compound index for user's appointments

// Pre-save middleware to validate date is in the future
appointmentSchema.pre('save', function(next) {
    if (this.isModified('date') && this.date <= new Date()) {
        return next(new Error('La date du rendez-vous doit être dans le futur'));
    }
    next();
});

// Method to confirm appointment
appointmentSchema.methods.confirm = async function() {
    this.status = 'confirmed';
    await this.save();
};

// Method to cancel appointment
appointmentSchema.methods.cancel = async function(reason = '') {
    this.status = 'cancelled';
    if (reason) {
        this.notes.push({
            content: `Annulé: ${reason}`,
            userType: 'User'
        });
    }
    await this.save();
};

// Method to complete appointment
appointmentSchema.methods.complete = async function(agentId) {
    this.status = 'completed';
    this.processedBy = agentId;
    this.processedAt = new Date();
    await this.save();
};

// Method to mark as no-show
appointmentSchema.methods.markNoShow = async function(agentId) {
    this.status = 'no_show';
    this.processedBy = agentId;
    this.processedAt = new Date();
    await this.save();
};

// Method to assign to service
appointmentSchema.methods.assignToService = async function(serviceId) {
    this.service = serviceId;
    await this.save();
};

// Method to assign to agent
appointmentSchema.methods.assignToAgent = async function(agentId) {
    this.assignedAgent = agentId;
    await this.save();
};

// Method to add reminder
appointmentSchema.methods.addReminder = async function(type) {
    if (!this.remindersSent.some(r => r.type === type)) {
        this.remindersSent.push({ type });
        await this.save();
    }
};

// Static method to find appointments by user
appointmentSchema.statics.findByUser = function(userId) {
    return this.find({ user: userId, date: { $gte: new Date() } })
        .sort({ date: 1, time: 1 });
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1, time: 1 });
};

// Static method to find today's appointments
appointmentSchema.statics.findToday = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.find({
        date: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $in: ['confirmed', 'pending'] }
    }).sort({ time: 1 });
};

// Static method to find appointments by service
appointmentSchema.statics.findByService = function(serviceId) {
    return this.find({ 
        service: serviceId,
        date: { $gte: new Date() },
        status: { $in: ['confirmed', 'pending'] }
    }).sort({ date: 1, time: 1 });
};

// Static method to find appointments by agent
appointmentSchema.statics.findByAgent = function(agentId) {
    return this.find({ 
        assignedAgent: agentId,
        date: { $gte: new Date() },
        status: { $in: ['confirmed', 'pending'] }
    }).sort({ date: 1, time: 1 });
};

// Static method to find pending appointments needing reminders
appointmentSchema.statics.findNeedingReminders = function() {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    return this.find({
        date: {
            $in: [twoDaysLater, oneDayLater, twoHoursLater]
        },
        status: 'confirmed',
        'remindersSent.type': { $nin: ['48h', '24h', '2h'] }
    });
};

// Static method to get appointment statistics
appointmentSchema.statics.getStatistics = async function(startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    return stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
    }, {});
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;