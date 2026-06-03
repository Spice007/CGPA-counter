const User = require('../models/User');
const Course = require('../models/Course');
const Result = require('../models/Result');

// @desc    Get site analytics
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        // Admin authorization check — allow env var email OR hardcoded super admin
        const adminEmails = [
            process.env.ADMIN_EMAIL || 'admin@spice.com',
            'gideonlastgids@gmail.com'
        ];
        if (!adminEmails.includes(req.user.email)) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const totalUsers = await User.countDocuments();
        const usersWithProfilePic = await User.countDocuments({ profilePicture: { $exists: true, $ne: '' } });
        const totalCourses = await Course.countDocuments();
        const totalResults = await Result.countDocuments();

        // Calculate total credit units registered across all users
        const totalUnitsData = await Course.aggregate([
            { $group: { _id: null, sum: { $sum: "$unit" } } }
        ]);
        const totalUnits = totalUnitsData.length > 0 ? totalUnitsData[0].sum : 0;

        // Calculate average GPA across all users and semesters
        const averageGpaData = await Result.aggregate([
            { $group: { _id: null, avg: { $avg: "$gpa" } } }
        ]);
        const averageGPA = averageGpaData.length > 0 ? averageGpaData[0].avg.toFixed(2) : "0.00";

        // Count unique registered universities/institutions
        const distinctUniversities = await User.distinct('university');
        const totalUniversities = distinctUniversities.filter(Boolean).length;

        // Count active users in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            $or: [
                { lastLogin: { $gte: sevenDaysAgo } },
                { createdAt: { $gte: sevenDaysAgo } }
            ]
        });

        const users = await User.find({}, 'email fullName matricNumber department faculty university profilePicture createdAt lastLogin').sort({ lastLogin: -1, createdAt: -1 });

        res.status(200).json({
            totalUsers,
            usersWithProfilePic,
            totalCourses,
            totalResults,
            totalUnits,
            averageGPA,
            totalUniversities,
            activeUsers,
            users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalytics
};
