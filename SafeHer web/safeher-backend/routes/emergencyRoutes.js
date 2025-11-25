/**
 * Emergency Routes
 * Handles panic button, emergency alerts, and emergency contacts
 */

const express = require('express');
const {
    activatePanicButton,
    resolveAlert,
    markFalseAlarm,
    getAlertHistory,
    getActiveAlerts,
    getSingleAlert,
    addEmergencyContact,
    getEmergencyContacts,
    getSingleContact,
    updateEmergencyContact,
    deleteEmergencyContact
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// EMERGENCY ALERT ROUTES
// ============================================

// @route   POST /api/v1/emergency/alert
// @desc    Activate panic button / Create emergency alert
// @access  Private
router.post('/alert', [
    body('longitude').notEmpty().isFloat().withMessage('Valid longitude is required'),
    body('latitude').notEmpty().isFloat().withMessage('Valid latitude is required'),
    body('address').optional().isString(),
    body('alertType').optional().isIn(['panic', 'medical', 'accident', 'harassment', 'other']),
    body('message').optional().isString().isLength({ max: 500 })
], activatePanicButton);

// @route   GET /api/v1/emergency/alerts
// @desc    Get user's alert history
// @access  Private
router.get('/alerts', getAlertHistory);

// @route   GET /api/v1/emergency/alerts/active
// @desc    Get active alerts for user
// @access  Private
router.get('/alerts/active', getActiveAlerts);

// @route   GET /api/v1/emergency/alerts/:id
// @desc    Get single alert details
// @access  Private
router.get('/alerts/:id', getSingleAlert);

// @route   PUT /api/v1/emergency/alerts/:id/resolve
// @desc    Resolve/deactivate an emergency alert
// @access  Private
router.put('/alerts/:id/resolve', [
    body('outcome').optional().isIn(['safe', 'assisted', 'hospitalized', 'unknown']),
    body('notes').optional().isString().isLength({ max: 500 })
], resolveAlert);

// @route   PUT /api/v1/emergency/alerts/:id/false-alarm
// @desc    Mark alert as false alarm
// @access  Private
router.put('/alerts/:id/false-alarm', markFalseAlarm);

// ============================================
// EMERGENCY CONTACT ROUTES
// ============================================

// @route   POST /api/v1/emergency/contacts
// @desc    Add new emergency contact
// @access  Private
router.post('/contacts', [
    body('name').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone').notEmpty().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Valid phone number is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('relation').notEmpty().isIn(['Family', 'Friend', 'Partner', 'Colleague', 'Guardian', 'Other']).withMessage('Valid relation is required'),
    body('isPrimary').optional().isBoolean(),
    body('notes').optional().isString().isLength({ max: 200 })
], addEmergencyContact);

// @route   GET /api/v1/emergency/contacts
// @desc    Get all emergency contacts for user
// @access  Private
router.get('/contacts', getEmergencyContacts);

// @route   GET /api/v1/emergency/contacts/:id
// @desc    Get single emergency contact
// @access  Private
router.get('/contacts/:id', getSingleContact);

// @route   PUT /api/v1/emergency/contacts/:id
// @desc    Update emergency contact
// @access  Private
router.put('/contacts/:id', [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone').optional().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    body('email').optional().isEmail(),
    body('relation').optional().isIn(['Family', 'Friend', 'Partner', 'Colleague', 'Guardian', 'Other']),
    body('isPrimary').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('notes').optional().isString().isLength({ max: 200 })
], updateEmergencyContact);

// @route   DELETE /api/v1/emergency/contacts/:id
// @desc    Delete emergency contact
// @access  Private
router.delete('/contacts/:id', deleteEmergencyContact);

module.exports = router;