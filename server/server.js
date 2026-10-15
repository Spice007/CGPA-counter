const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');
require('dotenv').config(); // Load from root .env first
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Then server .env
const connectDB = require('./config/db');

// Connect to Database
connectDB().then(() => {
    // Automatically purge any phantom/duplicate courses and ensure unique index on startup
    const { executeCourseCleanup } = require('./controllers/adminController');
    setTimeout(async () => {
        try {
            await executeCourseCleanup();
        } catch (cleanErr) {
            console.warn('⚠️ [Startup Cleanup] Error running course cleanup:', cleanErr.message);
        }
    }, 2500);
}).catch(err => {
    console.error('Failed to connect to DB during startup:', err);
});

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const resultRoutes = require('./routes/resultRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.use(passport.initialize());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Basic routes
app.get('/', (req, res) => {
    res.send('CGPA Calculator API is running (MongoDB Mode)...');
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        mode: 'MongoDB',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Self-Ping Keep-Alive to prevent Render Free-Tier Spin Down
const https = require('https');
const http = require('http');

const startKeepAlive = () => {
    const backendUrl = process.env.RENDER_EXTERNAL_URL || 'https://cgpa-calculator-backend-a9kj.onrender.com';
    const intervalMs = 14 * 60 * 1000; // Ping every 14 minutes (Render sleeps after 15 mins)

    console.log(`🌐 Render Keep-Alive active targeting: ${backendUrl}/ping`);

    setInterval(() => {
        try {
            const client = backendUrl.startsWith('https') ? https : http;
            client.get(`${backendUrl}/ping`, (res) => {
                console.log(`⚡ [Keep-Alive] Self ping success (${res.statusCode})`);
            }).on('error', (err) => {
                console.warn(`⚠️ [Keep-Alive] Ping issue: ${err.message}`);
            });
        } catch (err) {
            console.warn(`⚠️ [Keep-Alive] Ping error: ${err.message}`);
        }
    }, intervalMs);
};

console.log(`Attempting to start server on ${HOST}:${PORT}...`);
try {
    const server = app.listen(PORT, HOST, () => {
        console.log(`✅ Server successfully running on ${HOST}:${PORT} (MongoDB Mode)`);
        startKeepAlive();
    });
    
    server.on('error', (error) => {
        console.error(`❌ Server error: ${error.message}`);
    });
} catch (err) {
    console.error(`❌ Failed to call app.listen: ${err.message}`);
}

module.exports = app;

