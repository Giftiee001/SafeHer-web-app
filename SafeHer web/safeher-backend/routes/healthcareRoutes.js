/**
 * Healthcare Routes
 * Handles healthcare provider directory and related endpoints
 */

const express = require('express');
const {
    getAllProviders,
    getNearbyProviders,
    searchProviders,
    getProvider,
    recordCall,
    recordDirections,
    addReview,
    getProviderReviews,
    createProvider,
    updateProvider,
    deleteProvider
} = require('../controllers/healthcareController');
const { protect, authorize } = require('../middleware/auth');
const { body, query } = require('express-validator');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @route   GET /api/v1/healthcare/providers
// @desc    Get all healthcare providers (with filters)
// @access  Public
router.get('/providers', [
    query('type').optional().isString(),
    query('city').optional().isString(),
    query('services').optional().isString(),
    query('verified').optional().isBoolean()
], getAllProviders);

// @route   GET /api/v1/healthcare/providers/nearby
// @desc    Get nearby healthcare providers based on location
// @access  Public
router.get('/providers/nearby', [
    query('longitude').notEmpty().isFloat().withMessage('Valid longitude is required'),
    query('latitude').notEmpty().isFloat().withMessage('Valid latitude is required'),
    query('maxDistance').optional().isInt({ min: 100, max: 50000 }).withMessage('Max distance must be between 100m and 50km'),
    query('type').optional().isString()
], getNearbyProviders);

// @route   GET /api/v1/healthcare/providers/search
// @desc    Search healthcare providers by text
// @access  Public
router.get('/providers/search', [
    query('q').notEmpty().isString().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
], searchProviders);

// @route   GET /api/v1/healthcare/providers/:id
// @desc    Get single healthcare provider details
// @access  Public
router.get('/providers/:id', getProvider);

// @route   GET /api/v1/healthcare/providers/:id/reviews
// @desc    Get reviews for a provider
// @access  Public
router.get('/providers/:id/reviews', getProviderReviews);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// @route   POST /api/v1/healthcare/providers/:id/call
// @desc    Record that user called a provider
// @access  Private
router.post('/providers/:id/call', protect, recordCall);

// @route   POST /api/v1/healthcare/providers/:id/directions
// @desc    Record that user requested directions to provider
// @access  Private
router.post('/providers/:id/directions', protect, recordDirections);

// @route   POST /api/v1/healthcare/providers/:id/review
// @desc    Add a review for a healthcare provider
// @access  Private
router.post('/providers/:id/review', protect, [
    body('rating').notEmpty().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], addReview);

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

// @route   POST /api/v1/healthcare/providers
// @desc    Create new healthcare provider (Admin only)
// @access  Private/Admin
router.post('/providers', protect, authorize('admin'), [
    body('name').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
    body('type').notEmpty().isIn([
        'Hospital', 'Clinic', 'Emergency Service', 'Support Center', 
        'Helpline', 'Mental Health', 'Pharmacy', 'Diagnostic Center'
    ]).withMessage('Valid provider type is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates [longitude, latitude] required'),
    body('location.address').notEmpty().isString().withMessage('Address is required'),
    body('contact.phone').notEmpty().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Valid phone number is required'),
    body('services').isArray({ min: 1 }).withMessage('At least one service is required')
], createProvider);

// @route   PUT /api/v1/healthcare/providers/:id
// @desc    Update healthcare provider (Admin only)
// @access  Private/Admin
router.put('/providers/:id', protect, authorize('admin'), updateProvider);

// @route   DELETE /api/v1/healthcare/providers/:id
// @desc    Delete healthcare provider (Admin only)
// @access  Private/Admin
router.delete('/providers/:id', protect, authorize('admin'), deleteProvider);

module.exports = router;