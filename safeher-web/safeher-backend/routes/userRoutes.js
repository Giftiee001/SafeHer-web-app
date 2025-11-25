/**
 * User Routes
 * Handles user profile, settings, and location updates
 */

const express = require('express');
const {
    updateProfile,
    updateLocation,
    updateSettings,
    getSettings,
    uploadProfilePicture,
    deleteAccount,
    getUserStats,
    getLocationHistory
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// PROFILE ROUTES
// ============================================

// @route   PUT /api/v1/users/profile
// @desc    Update user profile information
// @access  Private
router.put('/profile', [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone').optional().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Valid phone number is required')
], updateProfile);

// @route   POST /api/v1/users/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile/picture', uploadProfilePicture);

// @route   DELETE /api/v1/users/account
// @desc    Delete user account permanently
// @access  Private
router.delete('/account', deleteAccount);

// ============================================
// LOCATION ROUTES
// ============================================

// @route   PUT /api/v1/users/location
// @desc    Update user's current location
// @access  Private
router.put('/location', [
    body('longitude').notEmpty().isFloat().withMessage('Valid longitude is required'),
    body('latitude').notEmpty().isFloat().withMessage('Valid latitude is required'),
    body('address').optional().isString()
], updateLocation);

// @route   GET /api/v1/users/location/history
// @desc    Get user's location sharing history
// @access  Private
router.get('/location/history', getLocationHistory);

// ============================================
// SETTINGS ROUTES
// ============================================

// @route   GET /api/v1/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', getSettings);

// @route   PUT /api/v1/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', [
    body('autoShareLocation').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('soundAlerts').optional().isBoolean(),
    body('language').optional().isIn(['en', 'yo', 'ig', 'ha'])
], updateSettings);

// ============================================
// STATISTICS ROUTES
// ============================================

// @route   GET /api/v1/users/stats
// @desc    Get user statistics (alerts sent, contacts, etc.)
// @access  Private
router.get('/stats', getUserStats);

module.exports = router;