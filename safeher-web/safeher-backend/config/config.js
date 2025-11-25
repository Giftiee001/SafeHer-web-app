// config/config.js
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    
    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        host: process.env.HOST || 'localhost'
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/safeher',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'safeher-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRE || '7d',
        cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7 // days
    },

    // Client Configuration
    client: {
        url: process.env.CLIENT_URL || 'http://localhost:8000',
        allowedOrigins: process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000']
    },

    // CORS Configuration
    cors: {
        origin: function (origin, callback) {
            const allowedOrigins = config.client.allowedOrigins;
            
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: 'Too many requests from this IP, please try again later.',
        
        // Stricter rate limit for authentication endpoints
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 5,
            message: 'Too many authentication attempts, please try again later.'
        },
        
        // Rate limit for emergency alerts
        emergency: {
            windowMs: 1 * 60 * 1000, // 1 minute
            maxRequests: 3,
            message: 'Emergency alert rate limit reached. Please wait before sending another alert.'
        }
    },

    // Email Configuration (Nodemailer)
    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASSWORD || ''
        },
        from: process.env.EMAIL_FROM || 'SafeHer <noreply@safeher.com>',
        
        // Email templates
        templates: {
            welcome: {
                subject: 'Welcome to SafeHer!',
                html: '<h1>Welcome to SafeHer</h1><p>Your safety is our priority.</p>'
            },
            passwordReset: {
                subject: 'Password Reset Request',
                html: '<h1>Password Reset</h1><p>Click the link to reset your password.</p>'
            },
            emergencyAlert: {
                subject: '🚨 EMERGENCY ALERT - SafeHer',
                html: '<h1>Emergency Alert Triggered</h1>'
            }
        }
    },

    // SMS Configuration (Twilio/Termii)
    sms: {
        // Twilio Configuration
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
            enabled: process.env.SMS_PROVIDER === 'twilio'
        },
        
        // Termii Configuration (Popular in Nigeria)
        termii: {
            apiKey: process.env.TERMII_API_KEY || '',
            senderId: process.env.TERMII_SENDER_ID || 'SafeHer',
            enabled: process.env.SMS_PROVIDER === 'termii'
        },
        
        // Active provider
        provider: process.env.SMS_PROVIDER || 'twilio', // 'twilio' or 'termii'
        
        // SMS templates
        templates: {
            emergencyAlert: (name, location) => 
                `🚨 EMERGENCY ALERT: ${name} needs help! Location: ${location}. Sent via SafeHer.`,
            verification: (code) => 
                `Your SafeHer verification code is: ${code}. Valid for 10 minutes.`
        }
    },

    // Geolocation Configuration
    geolocation: {
        defaultRadius: 5000, // meters (5km)
        maxRadius: 50000, // meters (50km)
        nearbySearchLimit: 20,
        
        // Nigeria's approximate center for fallback
        defaultLocation: {
            latitude: 9.0820,
            longitude: 8.6753
        }
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        uploadDir: process.env.UPLOAD_DIR || './uploads'
    },

    // Security Configuration
    security: {
        // Bcrypt rounds for password hashing
        bcryptRounds: 12,
        
        // Password requirements
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
        },
        
        // Session configuration
        session: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secret: process.env.SESSION_SECRET || 'safeher-session-secret'
        },
        
        // Helmet security headers
        helmet: {
            contentSecurityPolicy: process.env.NODE_ENV === 'production',
            crossOriginEmbedderPolicy: false
        }
    },

    // Emergency Configuration
    emergency: {
        // Default emergency contacts to add for new users
        defaultContacts: [],
        
        // Alert settings
        alertCooldown: 60000, // 1 minute between alerts
        maxAlertsPerDay: 50,
        
        // Response timeout
        responseTimeout: 300000, // 5 minutes
        
        // Emergency services numbers (Nigeria)
        emergencyNumbers: {
            police: '112',
            ambulance: '112',
            fire: '112',
            nema: '112' // National Emergency Management Agency
        }
    },

    // Healthcare Configuration
    healthcare: {
        categories: [
            'Hospital',
            'Clinic',
            'Pharmacy',
            'Mental Health',
            'Reproductive Health',
            'Emergency Room',
            'Maternity',
            'Laboratory'
        ],
        
        // Search configuration
        searchRadius: 10000, // 10km default
        maxSearchResults: 50
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
        
        // Log file paths
        files: {
            error: './logs/error.log',
            combined: './logs/combined.log'
        }
    },

    // Pagination Configuration
    pagination: {
        defaultLimit: 20,
        maxLimit: 100
    },

    // Notification Configuration
    notifications: {
        enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
        channels: ['push', 'email', 'sms'],
        
        // Priority levels
        priority: {
            emergency: 'high',
            alert: 'medium',
            info: 'low'
        }
    },

    // API Configuration
    api: {
        version: 'v1',
        prefix: '/api',
        timeout: 30000, // 30 seconds
        
        // API documentation
        docs: {
            enabled: process.env.API_DOCS_ENABLED !== 'false',
            path: '/api-docs'
        }
    },

    // Feature Flags
    features: {
        registration: process.env.FEATURE_REGISTRATION !== 'false',
        emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
        smsVerification: process.env.FEATURE_SMS_VERIFICATION === 'true',
        socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
        voiceCall: process.env.FEATURE_VOICE_CALL === 'true',
        videoCall: process.env.FEATURE_VIDEO_CALL === 'true'
    }
};

// Validation function
const validateConfig = () => {
    const required = [
        'JWT_SECRET',
        'MONGODB_URI'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0 && config.env === 'production') {
        console.error('Missing required environment variables:', missing.join(', '));
        console.error('Please check your .env file');
        process.exit(1);
    }

    // Warn about default values in production
    if (config.env === 'production') {
        if (config.jwt.secret.includes('change-in-production')) {
            console.warn('⚠️  WARNING: Using default JWT secret in production!');
        }
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('⚠️  WARNING: Email configuration not set!');
        }
    }
};

// Run validation
validateConfig();

// Export configuration
module.exports = config;