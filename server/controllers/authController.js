const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/emailService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ─── Google OAuth Strategy ────────────────────────────────────────────────────
const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogleCreds) {
    passport.use(new GoogleStrategy({
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'https://cgpa-counter-production.up.railway.app/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email returned from Google'), null);

            // Find existing user or create one
            let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

            if (user) {
                // Link Google ID if they previously registered with email/password
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.authProvider = 'google';
                    user.profilePicture = profile.photos?.[0]?.value || user.profilePicture;
                    await user.save();
                }
            } else {
                // Brand new user via Google
                user = await User.create({
                    fullName:       profile.displayName || email.split('@')[0],
                    email,
                    googleId:       profile.id,
                    authProvider:   'google',
                    profilePicture: profile.photos?.[0]?.value || '',
                    matricNumber:   '',
                    department:     '',
                    faculty:        ''
                });
            }

            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.warn('⚠️ Google OAuth credentials missing. Google login is disabled.');
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try { done(null, await User.findById(id)); }
    catch (err) { done(err, null); }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, matricNumber, department, faculty } = req.body;

    if (!fullName || !email || !password || !matricNumber || !department || !faculty) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        if (userExists.authProvider === 'google' || !userExists.password) {
            throw new Error('An account with this email already exists via Google. Please use Google Login.');
        }
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        fullName,
        email,
        password,
        matricNumber,
        department,
        faculty
    });

    if (user) {
        res.status(201).json({
            _id: user.id || user._id,
            fullName: user.fullName,
            email: user.email,
            matricNumber: user.matricNumber,
            department: user.department,
            faculty: user.faculty,
            token: generateToken(user.id || user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user) {
        if (!user.password) {
            res.status(400);
            throw new Error('This account uses Google Login. Please use the "Continue with Google" button.');
        }

        if (await bcrypt.compare(password, user.password)) {
            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user.id || user._id,
                fullName: user.fullName,
                email: user.email,
                matricNumber: user.matricNumber,
                department: user.department,
                faculty: user.faculty,
                token: generateToken(user.id || user._id)
            });
            return;
        }
    }

    res.status(401);
    throw new Error('Invalid credentials');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'User logged out' });
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc  Start Google OAuth flow
// @route GET /api/auth/google
const googleAuth = (req, res, next) => {
    if (!hasGoogleCreds) {
        return res.status(501).json({ message: 'Google OAuth not configured on this server.' });
    }
    const frontendUrl = req.query.frontend || '';
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: frontendUrl
    })(req, res, next);
};

// @desc  Google OAuth callback
// @route GET /api/auth/google/callback
const googleCallback = (req, res, next) => {
    if (!hasGoogleCreds) {
        return res.status(501).json({ message: 'Google OAuth not configured on this server.' });
    }
    
    let frontendURL = req.query.state || process.env.FRONTEND_URL || 'https://cgpa-counter.vercel.app';
    if (frontendURL.endsWith('/')) {
        frontendURL = frontendURL.slice(0, -1);
    }
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.redirect(`${frontendURL}/login.html?error=google_failed`);
        }
        
        const token = generateToken(user._id);
        const userObj = {
            _id:          user._id,
            fullName:     user.fullName,
            email:        user.email,
            matricNumber: user.matricNumber,
            department:   user.department,
            faculty:      user.faculty,
            profilePicture: user.profilePicture
        };
        const encoded = encodeURIComponent(JSON.stringify(userObj));
        res.redirect(`${frontendURL}/auth-callback.html?token=${token}&user=${encoded}`);
    })(req, res, next);
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('No account found with this email');
    }

    // Google OAuth accounts do not have passwords, so they cannot reset password
    if (user.authProvider === 'google' || !user.password) {
        res.status(400);
        throw new Error('This account uses Google Login. Please sign in with Google.');
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiry (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Determine the frontend URL based on where the request came from
    let frontendURL = req.headers.origin || process.env.FRONTEND_URL || 'https://cgpa-counter.vercel.app';
    if (frontendURL.endsWith('/')) {
        frontendURL = frontendURL.slice(0, -1);
    }

    const resetUrl = `${frontendURL}/reset-password.html?token=${resetToken}`;

    try {
        const mailResult = await sendResetEmail(user.email, resetUrl);
        
        // In local/development, we return the reset url directly for testing convenience
        const isLocal = windowLocationLocal(req) || process.env.NODE_ENV !== 'production';

        res.status(200).json({
            message: mailResult.simulated 
                ? 'Password reset link generated! (Mock Mode)' 
                : 'Password reset link sent to your email.',
            resetUrl: isLocal ? resetUrl : undefined
        });
    } catch (err) {
        // Clear token on failure
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.error('Failed to send reset email:', err);
        res.status(500);
        throw new Error('Failed to send reset email. Please try again later.');
    }
});

// Helper to check if running local
const windowLocationLocal = (req) => {
    const host = req.headers.host || '';
    return host.includes('localhost') || host.includes('127.0.0.1');
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        res.status(400);
        throw new Error('Please provide token and new password');
    }

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset token');
    }

    // Set new password (which will be hashed automatically by userSchema's pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    googleAuth,
    googleCallback,
    forgotPassword,
    resetPassword
};
