const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateGvuUsername, isUserRegistrationComplete } = require('../utils/usernameHelper');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id || req.user._id);

    if (user) {
        // If registration is complete and username is not yet generated, assign it
        if (isUserRegistrationComplete(user) && !user.username) {
            user.username = await generateGvuUsername(user.fullName, User, user._id);
            await user.save();
        }
        const userObj = user.toObject();
        userObj.hasPassword = Boolean(user.password);
        delete userObj.password;
        res.json(userObj);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile (Registration Completion & Password Creation)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id || req.user._id);

    if (user) {
        user.fullName = req.body.fullName ? req.body.fullName.trim() : user.fullName;
        user.email = req.body.email ? req.body.email.trim() : user.email;
        if (req.body.matricNumber !== undefined) user.matricNumber = req.body.matricNumber.trim();
        if (req.body.department !== undefined) user.department = req.body.department.trim();
        if (req.body.faculty !== undefined) user.faculty = req.body.faculty.trim();
        if (req.body.university !== undefined) user.university = req.body.university.trim();
        if (req.body.academicSession !== undefined) user.academicSession = req.body.academicSession;
        
        if (req.body.profilePicture !== undefined) {
            user.profilePicture = req.body.profilePicture;
        }

        // Allow Google users (or any user) without a password to create/set a password
        if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim()) {
            const cleanPw = req.body.password.trim();
            if (cleanPw.length < 6) {
                res.status(400);
                throw new Error('Password must be at least 6 characters');
            }
            user.password = cleanPw; // userSchema pre-save hook will hash it with bcrypt
        }

        // When user completes registration (matricNumber, faculty, dept), assign .gvu.ed username if missing
        if (isUserRegistrationComplete(user) && !user.username) {
            user.username = await generateGvuUsername(user.fullName, User, user._id);
        }

        // If user hasn't received welcome email yet, send it now
        if (!user.welcomeEmailSent && isUserRegistrationComplete(user)) {
            user.welcomeEmailSent = true;
            const frontendURL = req.headers.origin || process.env.FRONTEND_URL || 'https://cgpa-counter.vercel.app';
            sendWelcomeEmail(user.email, user.fullName, { username: user.username, frontendUrl: frontendURL })
                .catch(err => console.error('Error sending welcome email on profile completion:', err));
        }

        const updatedUser = await user.save();
        const userObj = updatedUser.toObject();
        userObj.hasPassword = Boolean(updatedUser.password);
        delete userObj.password;
        res.json(userObj);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getUserProfile,
    updateUserProfile
};
