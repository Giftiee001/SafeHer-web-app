/**
 * Emergency Controller
 * Handles emergency alerts, panic button, and emergency contacts
 */

const EmergencyAlert = require('../models/EmergencyAlert');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const { sendSMS } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');
const { sendPushNotification } = require('../services/notificationService');

// @desc    Activate panic button / Create emergency alert
// @route   POST /api/v1/emergency/alert
// @access  Private
exports.activatePanicButton = async (req, res, next) => {
    try {
        const { longitude, latitude, address, accuracy, alertType, message } = req.body;

        // Validate location
        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Location is required for emergency alert'
            });
        }

        // Get user's emergency contacts
        const contacts = await EmergencyContact.getActiveContacts(req.user.id);

        if (contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No emergency contacts found. Please add emergency contacts first.'
            });
        }

        // Create emergency alert
        const alert = await EmergencyAlert.create({
            user: req.user.id,
            alertType: alertType || 'panic',
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                address,
                accuracy
            },
            additionalInfo: {
                message,
                batteryLevel: req.body.batteryLevel,
                networkType: req.body.networkType
            }
        });

        // Update user location
        const user = await User.findById(req.user.id);
        await user.updateLocation(longitude, latitude, address);

        // Send notifications to all emergency contacts
        const notificationPromises = contacts.map(async (contact) => {
            const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const alertMessage = `🚨 EMERGENCY ALERT from ${user.name}!\n\nTime: ${new Date().toLocaleString()}\nLocation: ${address || 'View on map'}\nMap: ${locationUrl}\n\nPlease contact them immediately:\nPhone: ${user.phone}\nEmail: ${user.email}`;

            const notificationData = {
                contact: contact._id,
                notifiedAt: Date.now(),
                notificationMethod: [],
                deliveryStatus: 'pending'
            };

            // Send SMS
            if (contact.notificationPreferences.sms) {
                try {
                    await sendSMS(contact.phone, alertMessage);
                    notificationData.notificationMethod.push('sms');
                    notificationData.deliveryStatus = 'sent';
                    await contact.incrementAlertCount();
                } catch (smsError) {
                    console.error('SMS sending failed:', smsError);
                    notificationData.deliveryStatus = 'failed';
                }
            }

            // Send Email
            if (contact.notificationPreferences.email && contact.email) {
                try {
                    await sendEmail({
                        to: contact.email,
                        subject: `🚨 EMERGENCY ALERT - ${user.name} needs help!`,
                        html: `
                            <h1 style="color: #ef4444;">🚨 EMERGENCY ALERT</h1>
                            <p><strong>${user.name}</strong> has activated an emergency alert!</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>Location:</strong> ${address || 'Location data available'}</p>
                            <p><a href="${locationUrl}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View Location on Map</a></p>
                            <h2>Contact Information:</h2>
                            <p><strong>Phone:</strong> ${user.phone}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            ${message ? `<p><strong>Additional Message:</strong> ${message}</p>` : ''}
                            <p style="color: #ef4444; font-weight: bold;">Please contact them immediately!</p>
                        `
                    });
                    notificationData.notificationMethod.push('email');
                } catch (emailError) {
                    console.error('Email sending failed:', emailError);
                }
            }

            // Send Push Notification
            if (contact.notificationPreferences.push) {
                try {
                    await sendPushNotification(contact._id, {
                        title: '🚨 Emergency Alert',
                        body: `${user.name} needs help! Tap to view location.`,
                        data: {
                            alertId: alert._id,
                            userId: user._id,
                            location: { latitude, longitude }
                        }
                    });
                    notificationData.notificationMethod.push('push');
                } catch (pushError) {
                    console.error('Push notification failed:', pushError);
                }
            }

            return notificationData;
        });

        const notifications = await Promise.all(notificationPromises);
        
        // Update alert with notification data
        alert.notifiedContacts = notifications;
        await alert.save();

        // Emit socket event for real-time updates
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${req.user.id}`).emit('alert_activated', {
                alertId: alert._id,
                status: 'active',
                notifiedCount: contacts.length
            });
        }

        res.status(201).json({
            success: true,
            message: `Emergency alert activated! ${contacts.length} contact(s) have been notified.`,
            data: {
                alertId: alert._id,
                status: alert.status,
                location: alert.location,
                notifiedContacts: contacts.length,
                activatedAt: alert.activatedAt
            }
        });

    } catch (error) {
        console.error('Panic button activation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating emergency alert',
            error: error.message
        });
    }
};

// @desc    Deactivate/Resolve emergency alert
// @route   PUT /api/v1/emergency/alert/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res, next) => {
    try {
        const { outcome, notes } = req.body;

        const alert = await EmergencyAlert.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        if (alert.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Alert is not active'
            });
        }

        await alert.resolveAlert(req.user.id, outcome, notes);

        // Notify contacts that alert has been resolved
        const user = await User.findById(req.user.id);
        const contacts = await EmergencyContact.find({
            _id: { $in: alert.notifiedContacts.map(nc => nc.contact) }
        });

        const resolutionMessage = `✅ SafeHer Alert Update: ${user.name} has marked their emergency as resolved. Status: ${outcome}`;

        contacts.forEach(async (contact) => {
            if (contact.notificationPreferences.sms) {
                try {
                    await sendSMS(contact.phone, resolutionMessage);
                } catch (error) {
                    console.error('SMS sending failed:', error);
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Alert resolved successfully',
            data: alert
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resolving alert',
            error: error.message
        });
    }
};

// @desc    Mark alert as false alarm
// @route   PUT /api/v1/emergency/alert/:id/false-alarm
// @access  Private
exports.markFalseAlarm = async (req, res, next) => {
    try {
        const alert = await EmergencyAlert.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        await alert.markAsFalseAlarm();

        res.status(200).json({
            success: true,
            message: 'Alert marked as false alarm',
            data: alert
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking alert',
            error: error.message
        });
    }
};

// @desc    Get user's alert history
// @route   GET /api/v1/emergency/alerts
// @access  Private
exports.getAlertHistory = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const alerts = await EmergencyAlert.getUserAlertHistory(req.user.id, limit);

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching alert history',
            error: error.message
        });
    }
};

// @desc    Get active alerts
// @route   GET /api/v1/emergency/alerts/active
// @access  Private
exports.getActiveAlerts = async (req, res, next) => {
    try {
        const alerts = await EmergencyAlert.find({
            user: req.user.id,
            status: 'active'
        }).populate('notifiedContacts.contact', 'name phone');

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching active alerts',
            error: error.message
        });
    }
};

// @desc    Add emergency contact
// @route   POST /api/v1/emergency/contacts
// @access  Private
exports.addEmergencyContact = async (req, res, next) => {
    try {
        const { name, phone, email, relation, isPrimary, notes } = req.body;

        // Check if contact already exists
        const existingContact = await EmergencyContact.findOne({
            user: req.user.id,
            phone
        });

        if (existingContact) {
            return res.status(400).json({
                success: false,
                message: 'Contact with this phone number already exists'
            });
        }

        // If setting as primary, remove primary from other contacts
        if (isPrimary) {
            await EmergencyContact.updateMany(
                { user: req.user.id, isPrimary: true },
                { isPrimary: false }
            );
        }

        const contact = await EmergencyContact.create({
            user: req.user.id,
            name,
            phone,
            email,
            relation,
            isPrimary,
            notes
        });

        // Update user's emergency contacts array
        await User.findByIdAndUpdate(req.user.id, {
            $push: { emergencyContacts: contact._id }
        });

        res.status(201).json({
            success: true,
            message: 'Emergency contact added successfully',
            data: contact
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding emergency contact',
            error: error.message
        });
    }
};

// @desc    Get all emergency contacts
// @route   GET /api/v1/emergency/contacts
// @access  Private
exports.getEmergencyContacts = async (req, res, next) => {
    try {
        const contacts = await EmergencyContact.getActiveContacts(req.user.id);

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching emergency contacts',
            error: error.message
        });
    }
};

// @desc    Update emergency contact
// @route   PUT /api/v1/emergency/contacts/:id
// @access  Private
exports.updateEmergencyContact = async (req, res, next) => {
    try {
        let contact = await EmergencyContact.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // If setting as primary, remove primary from other contacts
        if (req.body.isPrimary) {
            await EmergencyContact.updateMany(
                { user: req.user.id, _id: { $ne: req.params.id }, isPrimary: true },
                { isPrimary: false }
            );
        }

        contact = await EmergencyContact.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating contact',
            error: error.message
        });
    }
};

// @desc    Delete emergency contact
// @route   DELETE /api/v1/emergency/contacts/:id
// @access  Private
exports.deleteEmergencyContact = async (req, res, next) => {
    try {
        const contact = await EmergencyContact.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        await contact.remove();

        // Remove from user's emergency contacts array
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { emergencyContacts: req.params.id }
        });

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully',
            data: {}
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting contact',
            error: error.message
        });
    }
};

module.exports = exports;