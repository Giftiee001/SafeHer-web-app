const HealthcareProvider = require('../models/HealthcareProvider');
const geolib = require('geolib');

// @desc    Get all healthcare providers
// @route   GET /api/v1/healthcare/providers
// @access  Public
exports.getAllProviders = async (req, res) => {
    try {
        const { type, city, services, verified } = req.query;
        
        let query = { isActive: true };
        
        if (type) query.type = type;
        if (city) query['location.city'] = city;
        if (verified === 'true') query['verification.isVerified'] = true;
        if (services) query.services = { $in: services.split(',') };

        const providers = await HealthcareProvider.find(query)
            .select('-reviews')
            .sort({ 'rating.average': -1 });

        res.status(200).json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching providers',
            error: error.message
        });
    }
};

// @desc    Get nearby healthcare providers
// @route   GET /api/v1/healthcare/providers/nearby
// @access  Public
exports.getNearbyProviders = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance, type } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude and latitude'
            });
        }

        const distance = maxDistance || 10000; // Default 10km
        const providers = await HealthcareProvider.findNearby(
            parseFloat(longitude),
            parseFloat(latitude),
            distance,
            type
        );

        res.status(200).json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finding nearby providers',
            error: error.message
        });
    }
};

// @desc    Search healthcare providers
// @route   GET /api/v1/healthcare/providers/search
// @access  Public
exports.searchProviders = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Please provide search query'
            });
        }

        const providers = await HealthcareProvider.searchProviders(q);

        res.status(200).json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching providers',
            error: error.message
        });
    }
};

// @desc    Get single healthcare provider
// @route   GET /api/v1/healthcare/providers/:id
// @access  Public
exports.getProvider = async (req, res) => {
    try {
        const provider = await HealthcareProvider.findById(req.params.id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        // Increment view count
        await provider.incrementViews();

        res.status(200).json({
            success: true,
            data: provider
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching provider',
            error: error.message
        });
    }
};

// @desc    Record provider call
// @route   POST /api/v1/healthcare/providers/:id/call
// @access  Private
exports.recordCall = async (req, res) => {
    try {
        const provider = await HealthcareProvider.findById(req.params.id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        await provider.recordCall();

        res.status(200).json({
            success: true,
            message: 'Call recorded'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error recording call',
            error: error.message
        });
    }
};

// @desc    Record directions request
// @route   POST /api/v1/healthcare/providers/:id/directions
// @access  Private
exports.recordDirections = async (req, res) => {
    try {
        const provider = await HealthcareProvider.findById(req.params.id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        await provider.recordDirections();

        res.status(200).json({
            success: true,
            message: 'Directions request recorded'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error recording directions',
            error: error.message
        });
    }
};

module.exports = exports;