const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id || req.user._id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id || req.user._id);

    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;
        user.matricNumber = req.body.matricNumber || user.matricNumber;
        user.department = req.body.department || user.department;
        user.faculty = req.body.faculty || user.faculty;
        user.university = req.body.university !== undefined ? req.body.university : user.university;
        user.academicSession = req.body.academicSession !== undefined ? req.body.academicSession : user.academicSession;
        
        if (req.body.profilePicture !== undefined) {
            user.profilePicture = req.body.profilePicture;
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
