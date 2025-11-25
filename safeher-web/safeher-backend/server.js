const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports that need env vars
dotenv.config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/supabase');

// Test Supabase connection
testConnection();

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ 
    origin: process.env.CLIENT_URL || 'http://localhost:8000',
    credentials: true 
}));

// Basic routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SafeHer API is running with Supabase!',
        version: '1.0.0',
        database: 'Supabase (PostgreSQL)'
    });
});

app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'Health check passed',
        database: 'Supabase'
    });
});

// Mount API routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/emergency', require('./routes/emergencyRoutes'));
// TODO: Fix missing controller functions before enabling
// app.use('/api/v1/healthcare', require('./routes/healthcareRoutes'));
// app.use('/api/v1/user', require('./routes/userRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('=====================================');
    console.log('SafeHer API Server Started');
    console.log('Port: ' + PORT);
    console.log('URL: http://localhost:' + PORT);
    console.log('Database: Supabase');
    console.log('Routes: /api/v1/auth');
    console.log('=====================================');
});

module.exports = app;