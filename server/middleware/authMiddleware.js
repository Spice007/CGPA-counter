const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./errorMiddleware');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            let user = await User.findById(decoded.id).select('-password');
            if (!user) {
                const Admin = require('../models/Admin');
                user = await Admin.findById(decoded.id).select('-password');
            }
            if (user) {
                // One-time pre-launch session invalidation for existing sessions (except Gideon's Gmail)
                const isGideon = (user.email && user.email.toLowerCase() === 'gideonlastgids@gmail.com') ||
                                 (user.role === 'superadmin');
                if (!isGideon) {
                    const LAUNCH_PREP_CUTOFF = 1792119200; // 2026-10-16 03:53:00 UTC+1
                    if (decoded.iat && decoded.iat < LAUNCH_PREP_CUTOFF) {
                        res.status(401);
                        throw new Error('Session expired for launch preparation. Please log in again.');
                    }
                }
                req.user = user;
                return next();
            } else {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
