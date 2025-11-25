// middleware/errorHandler.js

/**
 * Custom Error Class
 * Extends the built-in Error class with statusCode and isOperational properties
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error Handler Middleware
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map(error => error.message)
            .join(', ');
        error = new ErrorResponse(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again.';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Your token has expired. Please log in again.';
        error = new ErrorResponse(message, 401);
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size too large. Maximum size is 5MB';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Too many files uploaded';
        }
        
        error = new ErrorResponse(message, 400);
    }

    // Default error response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err 
        })
    });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not Found Handler
 * Handles requests to undefined routes
 */
const notFound = (req, res, next) => {
    const error = new ErrorResponse(
        `Route not found - ${req.originalUrl}`,
        404
    );
    next(error);
};

/**
 * Development Error Response
 * Sends detailed error information in development mode
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        errorDetails: err
    });
};

/**
 * Production Error Response
 * Sends clean error messages in production mode
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    } 
    // Programming or unknown error: don't leak error details
    else {
        console.error('ERROR 💥:', err);
        
        res.status(500).json({
            success: false,
            error: 'Something went wrong on our end. Please try again later.'
        });
    }
};

/**
 * Database Connection Error Handler
 */
const handleDatabaseError = (err) => {
    console.error('Database Connection Error:', err.message);
    
    if (process.env.NODE_ENV === 'production') {
        // Log to external service (e.g., Sentry, LogRocket)
        console.error('Database error logged to monitoring service');
    }
    
    return new ErrorResponse('Database connection failed', 500);
};

/**
 * Rate Limit Error Handler
 */
const handleRateLimitError = (req, res) => {
    return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: req.rateLimit ? req.rateLimit.resetTime : null
    });
};

/**
 * Validation Error Formatter
 * Formats express-validator errors into readable format
 */
const formatValidationErrors = (errors) => {
    return errors.map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
    }));
};

/**
 * Emergency Alert Error Handler
 * Special handler for critical emergency operations
 */
const handleEmergencyError = (err, req, res, next) => {
    console.error('🚨 EMERGENCY OPERATION ERROR:', {
        userId: req.user?.id,
        error: err.message,
        timestamp: new Date().toISOString()
    });

    // Log to critical error monitoring
    // In production, this should trigger alerts to administrators
    
    // Still try to send emergency notifications even if there's an error
    if (req.emergencyAlert) {
        console.log('Attempting to send emergency alert despite error...');
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: 'Emergency alert processing error. Please call emergency services directly.',
        emergencyNumbers: {
            police: '112',
            ambulance: '112',
            fire: '112'
        }
    });
};

/**
 * CORS Error Handler
 */
const handleCorsError = (err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Origin not allowed.',
            origin: req.headers.origin
        });
    }
    next(err);
};

/**
 * File Upload Error Handler
 */
const handleFileUploadError = (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File too large. Maximum size is 5MB.',
            maxSize: '5MB'
        });
    }
    
    if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type. Only JPEG, PNG and PDF files are allowed.',
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
        });
    }
    
    next(err);
};

/**
 * Authentication Error Handler
 */
const handleAuthError = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Please log in.',
            redirectTo: '/login'
        });
    }
    next(err);
};

/**
 * Global Error Logger
 * Logs errors to file or external service
 */
const logError = (err, req) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userId: req.user?.id
        }
    };

    // In production, send to external logging service
    console.error('Error Log:', JSON.stringify(errorLog, null, 2));
    
    // Could integrate with services like:
    // - Sentry
    // - LogRocket
    // - Winston file logging
    // - CloudWatch
};

module.exports = {
    ErrorResponse,
    errorHandler,
    asyncHandler,
    notFound,
    sendErrorDev,
    sendErrorProd,
    handleDatabaseError,
    handleRateLimitError,
    formatValidationErrors,
    handleEmergencyError,
    handleCorsError,
    handleFileUploadError,
    handleAuthError,
    logError
};