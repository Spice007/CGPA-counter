const User = require('../models/User');
const Course = require('../models/Course');
const Result = require('../models/Result');

// @desc    Get site analytics
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        // Admin authorization check
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@spice.com';
        if (req.user.email !== adminEmail) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const totalUsers = await User.countDocuments();
        const usersWithProfilePic = await User.countDocuments({ profilePicture: { $exists: true, $ne: '' } });
        const totalCourses = await Course.countDocuments();
        const totalResults = await Result.countDocuments();
        const users = await User.find({}, 'email fullName profilePicture createdAt lastLogin').sort({ lastLogin: -1 });

        res.status(200).json({
            totalUsers,
            usersWithProfilePic,
            totalCourses,
            totalResults,
            users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalytics
};
