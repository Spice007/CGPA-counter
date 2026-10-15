const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateGvuUsername, isUserRegistrationComplete } = require('../utils/usernameHelper');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id || req.user._id).select('-password');

    if (user) {
        // If registration is complete and username is not yet generated, assign it
        if (isUserRegistrationComplete(user) && !user.username) {
            user.username = await generateGvuUsername(user.fullName, User, user._id);
            await user.save();
        }
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile (Registration Completion)
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

        // When user completes registration (matricNumber, faculty, dept), assign .gvu.ed username if missing
        if (isUserRegistrationComplete(user) && !user.username) {
            user.username = await generateGvuUsername(user.fullName, User, user._id);
        }

        const updatedUser = await user.save();
        const userObj = updatedUser.toObject();
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
