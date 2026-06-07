const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

    if (user && (await bcrypt.compare(password, user.password))) {
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
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
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
const googleAuth = hasGoogleCreds
    ? passport.authenticate('google', { scope: ['profile', 'email'] })
    : (req, res) => res.status(501).json({ message: 'Google OAuth not configured on this server.' });

// @desc  Google OAuth callback
// @route GET /api/auth/google/callback
const googleCallback = hasGoogleCreds
    ? [
        passport.authenticate('google', { session: false, failureRedirect: '/login.html?error=google_failed' }),
        (req, res) => {
            const token = generateToken(req.user._id);
            const user = {
                _id:          req.user._id,
                fullName:     req.user.fullName,
                email:        req.user.email,
                matricNumber: req.user.matricNumber,
                department:   req.user.department,
                faculty:      req.user.faculty,
                profilePicture: req.user.profilePicture
            };
            // Redirect to student portal with token — frontend reads it from URL
            const encoded = encodeURIComponent(JSON.stringify(user));
            const frontendURL = process.env.FRONTEND_URL || 'https://cgpa-counter.vercel.app';
            res.redirect(`${frontendURL}/auth-callback.html?token=${token}&user=${encoded}`);
        }
      ]
    : (req, res) => res.status(501).json({ message: 'Google OAuth not configured on this server.' });

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    googleAuth,
    googleCallback
};
