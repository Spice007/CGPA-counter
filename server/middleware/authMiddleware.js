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
                req.user = user;
            }

            return next();
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
