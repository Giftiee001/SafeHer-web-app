/**
 * Emergency Alert Model
 * Tracks all emergency panic button activations
 */

const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    alertType: {
        type: String,
        enum: ['panic', 'medical', 'accident', 'harassment', 'other'],
        default: 'panic'
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'false-alarm', 'cancelled'],
        default: 'active'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: String,
        accuracy: Number // GPS accuracy in meters
    },
    notifiedContacts: [{
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmergencyContact'
        },
        notifiedAt: Date,
        notificationMethod: {
            type: String,
            enum: ['sms', 'email', 'push', 'call']
        },
        deliveryStatus: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed'],
            default: 'pending'
        },
        acknowledgement: {
            acknowledged: {
                type: Boolean,
                default: false
            },
            acknowledgedAt: Date,
            response: String
        }
    }],
    emergencyServices: {
        contacted: {
            type: Boolean,
            default: false
        },
        serviceType: {
            type: String,
            enum: ['police', 'ambulance', 'fire', 'none'],
            default: 'none'
        },
        contactedAt: Date,
        referenceNumber: String
    },
    mediaAttachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio']
        },
        url: String,
        publicId: String,
        uploadedAt: Date
    }],
    additionalInfo: {
        message: {
            type: String,
            maxlength: [500, 'Message cannot exceed 500 characters']
        },
        batteryLevel: Number,
        networkType: String
    },
    resolution: {
        resolvedAt: Date,
        resolvedBy: String,
        resolutionNotes: String,
        outcome: {
            type: String,
            enum: ['safe', 'assisted', 'hospitalized', 'unknown']
        }
    },
    activatedAt: {
        type: Date,
        default: Date.now
    },
    deactivatedAt: Date,
    duration: Number // Duration in seconds
}, {
    timestamps: true
});

// Create geospatial index
emergencyAlertSchema.index({ location: '2dsphere' });

// Index for faster queries
emergencyAlertSchema.index({ user: 1, status: 1, activatedAt: -1 });
emergencyAlertSchema.index({ status: 1, activatedAt: -1 });

// Pre-save middleware to calculate duration
emergencyAlertSchema.pre('save', function(next) {
    if (this.deactivatedAt && this.activatedAt) {
        this.duration = Math.floor((this.deactivatedAt - this.activatedAt) / 1000);
    }
    next();
});

// Method to resolve alert
emergencyAlertSchema.methods.resolveAlert = async function(resolvedBy, outcome, notes) {
    this.status = 'resolved';
    this.resolution = {
        resolvedAt: Date.now(),
        resolvedBy,
        resolutionNotes: notes,
        outcome
    };
    this.deactivatedAt = Date.now();
    await this.save();
};

// Method to mark as false alarm
emergencyAlertSchema.methods.markAsFalseAlarm = async function() {
    this.status = 'false-alarm';
    this.deactivatedAt = Date.now();
    await this.save();
};

// Static method to get active alerts
emergencyAlertSchema.statics.getActiveAlerts = async function() {
    return await this.find({ status: 'active' })
        .populate('user', 'name phone email')
        .populate('notifiedContacts.contact', 'name phone')
        .sort({ activatedAt: -1 });
};

// Static method to get user's alert history
emergencyAlertSchema.statics.getUserAlertHistory = async function(userId, limit = 10) {
    return await this.find({ user: userId })
        .populate('notifiedContacts.contact', 'name phone relation')
        .sort({ activatedAt: -1 })
        .limit(limit);
};

// Static method to get statistics
emergencyAlertSchema.statics.getAlertStatistics = async function(userId) {
    const stats = await this.aggregate([
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgDuration: { $avg: '$duration' }
            }
        }
    ]);

    return stats;
};

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);