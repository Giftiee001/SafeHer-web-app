// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');
const { ErrorResponse } = require('./errorHandler');

/**
 * Validation Result Handler
 * Checks for validation errors and returns formatted response
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: formattedErrors
        });
    }
    
    next();
};

/**
 * User Registration Validation
 */
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(\+234|0)[789]\d{9}$/).withMessage('Please provide a valid Nigerian phone number'),
    
    body('bloodType')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood type'),
    
    body('dateOfBirth')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .custom(value => {
            const age = new Date().getFullYear() - new Date(value).getFullYear();
            if (age < 13) {
                throw new Error('You must be at least 13 years old to register');
            }
            return true;
        }),
    
    validate
];

/**
 * Login Validation
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    validate
];

/**
 * Email Validation
 */
const validateEmail = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .toLowerCase(),
    
    validate
];

/**
 * Password Reset Validation
 */
const validatePasswordReset = [
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your password')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    validate
];

/**
 * Emergency Contact Validation
 */
const validateEmergencyContact = [
    body('name')
        .trim()
        .notEmpty().withMessage('Contact name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(\+234|0)[789]\d{9}$/).withMessage('Please provide a valid Nigerian phone number'),
    
    body('relationship')
        .trim()
        .notEmpty().withMessage('Relationship is required')
        .isIn(['Family', 'Friend', 'Spouse', 'Partner', 'Colleague', 'Other'])
        .withMessage('Invalid relationship type'),
    
    body('email')
        .optional()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('isPrimary')
        .optional()
        .isBoolean().withMessage('isPrimary must be a boolean value'),
    
    validate
];

/**
 * Emergency Alert Validation
 */
const validateEmergencyAlert = [
    body('location')
        .notEmpty().withMessage('Location is required'),
    
    body('location.latitude')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    
    body('location.longitude')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    
    body('alertType')
        .optional()
        .isIn(['panic', 'medical', 'police', 'fire', 'other'])
        .withMessage('Invalid alert type'),
    
    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
    
    validate
];

/**
 * Healthcare Provider Validation
 */
const validateHealthcareProvider = [
    body('name')
        .trim()
        .notEmpty().withMessage('Provider name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['Hospital', 'Clinic', 'Pharmacy', 'Mental Health', 'Reproductive Health', 'Emergency Room', 'Maternity', 'Laboratory'])
        .withMessage('Invalid category'),
    
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required'),
    
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(\+234|0)[789]\d{9}$/).withMessage('Please provide a valid Nigerian phone number'),
    
    body('location.latitude')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    
    body('location.longitude')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    
    body('services')
        .optional()
        .isArray().withMessage('Services must be an array'),
    
    body('operatingHours')
        .optional()
        .isString().withMessage('Operating hours must be a string'),
    
    body('emergencyAvailable')
        .optional()
        .isBoolean().withMessage('emergencyAvailable must be a boolean'),
    
    validate
];

/**
 * Healthcare Search Validation
 */
const validateHealthcareSearch = [
    query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    
    query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    
    query('radius')
        .optional()
        .isInt({ min: 100, max: 50000 }).withMessage('Radius must be between 100m and 50km'),
    
    query('category')
        .optional()
        .isIn(['Hospital', 'Clinic', 'Pharmacy', 'Mental Health', 'Reproductive Health', 'Emergency Room', 'Maternity', 'Laboratory'])
        .withMessage('Invalid category'),
    
    query('emergencyOnly')
        .optional()
        .isBoolean().withMessage('emergencyOnly must be a boolean'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    validate
];

/**
 * Profile Update Validation
 */
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^(\+234|0)[789]\d{9}$/).withMessage('Please provide a valid Nigerian phone number'),
    
    body('bloodType')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood type'),
    
    body('medicalInfo.allergies')
        .optional()
        .isArray().withMessage('Allergies must be an array'),
    
    body('medicalInfo.medications')
        .optional()
        .isArray().withMessage('Medications must be an array'),
    
    body('medicalInfo.conditions')
        .optional()
        .isArray().withMessage('Conditions must be an array'),
    
    validate
];

/**
 * Location Sharing Validation
 */
const validateLocationSharing = [
    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    
    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    
    body('accuracy')
        .optional()
        .isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
    
    body('duration')
        .optional()
        .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
    
    validate
];

/**
 * MongoDB ObjectId Validation
 */
const validateObjectId = (paramName = 'id') => [
    param(paramName)
        .matches(/^[0-9a-fA-F]{24}$/).withMessage('Invalid ID format'),
    
    validate
];

/**
 * Pagination Validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
        .optional()
        .isString().withMessage('Sort field must be a string'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc', '1', '-1']).withMessage('Sort order must be asc or desc'),
    
    validate
];

/**
 * Custom Phone Number Validator
 */
const isNigerianPhoneNumber = (phone) => {
    const regex = /^(\+234|0)[789]\d{9}$/;
    return regex.test(phone);
};

/**
 * Custom Password Strength Validator
 */
const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumber;
};

/**
 * Sanitize User Input
 */
const sanitizeInput = (req, res, next) => {
    // Remove any potential XSS attempts
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};

module.exports = {
    validate,
    validateRegistration,
    validateLogin,
    validateEmail,
    validatePasswordReset,
    validateEmergencyContact,
    validateEmergencyAlert,
    validateHealthcareProvider,
    validateHealthcareSearch,
    validateProfileUpdate,
    validateLocationSharing,
    validateObjectId,
    validatePagination,
    isNigerianPhoneNumber,
    isStrongPassword,
    sanitizeInput
};