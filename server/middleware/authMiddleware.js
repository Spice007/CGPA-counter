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
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
            }

            return next();
        } catch (error) {
            console.error('Token verification failed, continuing as guest:', error.message);
        }
    }

    // Default to the first user if no token or token failed (Guest/Local Mode)
    const user = await User.findOne().select('-password');
    if (user) {
        req.user = user;
        return next();
    }

    res.status(401);
    throw new Error('Not authorized, no users found in database');
});

module.exports = { protect };
