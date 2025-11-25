/**
 * Emergency Contact Model
 * Defines trusted contacts for emergency alerts
 */

const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide contact name'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        trim: true,
        match: [
            /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
            'Please provide a valid phone number'
        ]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    relation: {
        type: String,
        required: [true, 'Please specify relationship'],
        enum: ['Family', 'Friend', 'Partner', 'Colleague', 'Guardian', 'Other'],
        default: 'Other'
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    notificationPreferences: {
        sms: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: false
        }
    },
    alertCount: {
        type: Number,
        default: 0
    },
    lastAlertSent: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    }
}, {
    timestamps: true
});

// Index for faster queries
emergencyContactSchema.index({ user: 1, phone: 1 }, { unique: true });

// Method to increment alert count
emergencyContactSchema.methods.incrementAlertCount = async function() {
    this.alertCount += 1;
    this.lastAlertSent = Date.now();
    await this.save();
};

// Static method to get all active contacts for a user
emergencyContactSchema.statics.getActiveContacts = async function(userId) {
    return await this.find({ user: userId, isActive: true }).sort({ isPrimary: -1, createdAt: 1 });
};

// Virtual for alert history
emergencyContactSchema.virtual('alerts', {
    ref: 'EmergencyAlert',
    localField: '_id',
    foreignField: 'notifiedContacts',
    justOne: false
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);