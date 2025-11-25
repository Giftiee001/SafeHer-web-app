/**
 * Healthcare Provider Model
 * Verified healthcare facilities and services
 */

const mongoose = require('mongoose');

const healthcareProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide provider name'],
        trim: true,
        unique: true
    },
    type: {
        type: String,
        required: [true, 'Please specify provider type'],
        enum: [
            'Hospital',
            'Clinic',
            'Emergency Service',
            'Support Center',
            'Helpline',
            'Mental Health',
            'Pharmacy',
            'Diagnostic Center'
        ]
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: {
            type: String,
            required: [true, 'Please provide address']
        },
        city: String,
        state: String,
        country: {
            type: String,
            default: 'Nigeria'
        },
        postalCode: String
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Please provide phone number']
        },
        alternatePhone: String,
        email: String,
        website: String,
        emergencyLine: String
    },
    services: [{
        type: String,
        enum: [
            'Emergency',
            '24/7',
            'Women\'s Health',
            'Maternity',
            'Pediatrics',
            'Surgery',
            'Counseling',
            'Family Planning',
            'Mental Health',
            'Legal Support',
            'Health Education',
            'Crisis Response',
            'Ambulance',
            'Laboratory',
            'Pharmacy',
            'Imaging'
        ]
    }],
    operatingHours: {
        monday: { open: String, close: String, is24Hours: Boolean },
        tuesday: { open: String, close: String, is24Hours: Boolean },
        wednesday: { open: String, close: String, is24Hours: Boolean },
        thursday: { open: String, close: String, is24Hours: Boolean },
        friday: { open: String, close: String, is24Hours: Boolean },
        saturday: { open: String, close: String, is24Hours: Boolean },
        sunday: { open: String, close: String, is24Hours: Boolean }
    },
    is24Hours: {
        type: Boolean,
        default: false
    },
    verification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: String,
        verifiedAt: Date,
        verificationDocuments: [{
            type: String,
            url: String
        }],
        licenseNumber: String
    },
    rating: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    images: [{
        url: String,
        publicId: String,
        caption: String
    }],
    amenities: [{
        type: String,
        enum: [
            'Parking',
            'Wheelchair Access',
            'Wi-Fi',
            'Waiting Room',
            'Cafeteria',
            'ATM',
            'Pharmacy On-Site',
            'Laboratory On-Site'
        ]
    }],
    insurance: [{
        type: String
    }],
    specializations: [{
        type: String
    }],
    staff: {
        doctors: Number,
        nurses: Number,
        supportStaff: Number
    },
    capacity: {
        beds: Number,
        emergencyBeds: Number,
        icuBeds: Number
    },
    statistics: {
        views: {
            type: Number,
            default: 0
        },
        calls: {
            type: Number,
            default: 0
        },
        directionsRequested: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create geospatial index
healthcareProviderSchema.index({ location: '2dsphere' });

// Text index for search
healthcareProviderSchema.index({
    name: 'text',
    'location.address': 'text',
    services: 'text',
    type: 'text'
});

// Compound indexes
healthcareProviderSchema.index({ type: 1, 'verification.isVerified': 1 });
healthcareProviderSchema.index({ 'location.city': 1, type: 1 });

// Method to increment view count
healthcareProviderSchema.methods.incrementViews = async function() {
    this.statistics.views += 1;
    await this.save();
};

// Method to record call
healthcareProviderSchema.methods.recordCall = async function() {
    this.statistics.calls += 1;
    await this.save();
};

// Method to record directions request
healthcareProviderSchema.methods.recordDirections = async function() {
    this.statistics.directionsRequested += 1;
    await this.save();
};

// Method to add review
healthcareProviderSchema.methods.addReview = async function(userId, rating, comment) {
    this.reviews.push({
        user: userId,
        rating,
        comment
    });

    // Recalculate average rating
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;

    await this.save();
};

// Static method to find nearby providers
healthcareProviderSchema.statics.findNearby = async function(longitude, latitude, maxDistance = 10000, type = null) {
    const query = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance // in meters
            }
        },
        isActive: true,
        'verification.isVerified': true
    };

    if (type) {
        query.type = type;
    }

    return await this.find(query).select('-reviews');
};

// Static method to search providers
healthcareProviderSchema.statics.searchProviders = async function(searchTerm) {
    return await this.find({
        $text: { $search: searchTerm },
        isActive: true,
        'verification.isVerified': true
    }).select('-reviews');
};

module.exports = mongoose.model('HealthcareProvider', healthcareProviderSchema);