const Course = require('../models/Course');
const Result = require('../models/Result');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Helper function to calculate and save GPA
const performGPACalculation = async (userId, session, semester) => {
    const courses = await Course.find({ user: userId, session, semester });

    if (courses.length === 0) {
        // If no courses, we might want to remove the result snapshot or set it to 0
        const existingResult = await Result.findOne({ user: userId, session, semester });
        if (existingResult) {
            await existingResult.deleteOne();
        }
        return { gpa: 0, totalUnits: 0, totalPoints: 0, academicStanding: 'N/A' };
    }

    let totalUnits = 0;
    let totalWeightedPoints = 0;

    courses.forEach(course => {
        totalUnits += course.unit;
        totalWeightedPoints += (course.unit * (course.gradePoint || 0));
    });

    const gpa = totalUnits > 0 ? parseFloat((totalWeightedPoints / totalUnits).toFixed(2)) : 0;

    // Determine academic standing based on GPA (Snapshot)
    let academicStanding = 'Probation';
    if (gpa >= 4.50) academicStanding = 'First Class';
    else if (gpa >= 3.50) academicStanding = 'Second Class Upper';
    else if (gpa >= 2.40) academicStanding = 'Second Class Lower';
    else if (gpa >= 1.50) academicStanding = 'Third Class';
    else if (gpa >= 1.00) academicStanding = 'Pass';

    // Update or create result snapshot
    let result = await Result.findOne({ user: userId, session, semester });
    
    if (result) {
        result.gpa = gpa;
        result.totalUnits = totalUnits;
        result.totalPoints = totalWeightedPoints;
        result.academicStanding = academicStanding;
        await result.save();
    } else {
        result = await Result.create({
            user: userId,
            session,
            semester,
            gpa,
            totalUnits,
            totalPoints: totalWeightedPoints,
            academicStanding
        });
    }

    return result;
};

// @desc    Calculate and get GPA for a specific semester
// @route   POST /api/results/calculate
// @access  Private
const calculateGPA = asyncHandler(async (req, res) => {
    const { session, semester } = req.body;

    if (!session || !semester) {
        res.status(400);
        throw new Error('Please provide session and semester');
    }

    const result = await performGPACalculation(req.user.id || req.user._id, session, semester);
    res.status(200).json(result);
});

// @desc    Get Cumulative CGPA
// @route   GET /api/results/cgpa
// @access  Private
const getCGPA = asyncHandler(async (req, res) => {
    const results = await Result.find({ user: req.user.id || req.user._id });

    if (results.length === 0) {
        return res.status(200).json({ cgpa: 0, totalUnits: 0, totalPoints: 0, standing: 'N/A' });
    }

    let grandTotalUnits = 0;
    let grandTotalPoints = 0;

    results.forEach(res => {
        grandTotalUnits += (res.totalUnits || 0);
        grandTotalPoints += (res.totalPoints || 0);
    });

    const cgpa = grandTotalUnits > 0 ? parseFloat((grandTotalPoints / grandTotalUnits).toFixed(2)) : 0;

    let standing = 'Probation';
    if (cgpa >= 4.50) standing = 'First Class';
    else if (cgpa >= 3.50) standing = 'Second Class Upper';
    else if (cgpa >= 2.40) standing = 'Second Class Lower';
    else if (cgpa >= 1.50) standing = 'Third Class';
    else if (cgpa >= 1.00) standing = 'Pass';

    res.status(200).json({
        cgpa,
        totalUnits: grandTotalUnits,
        totalPoints: grandTotalPoints,
        standing
    });
});

// @desc    Get all result snapshots
// @route   GET /api/results
// @access  Private
const getResults = asyncHandler(async (req, res) => {
    const results = await Result.find({ user: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(results);
});

// @desc    Get CGPA per Level (Session)
// @route   GET /api/results/levels
// @access  Private
const getLevelCGPA = asyncHandler(async (req, res) => {
    const results = await Result.find({ user: req.user.id || req.user._id });

    if (results.length === 0) {
        return res.status(200).json([]);
    }

    // Group by session
    const levels = {};
    results.forEach(r => {
        if (!levels[r.session]) {
            levels[r.session] = { totalUnits: 0, totalPoints: 0, session: r.session };
        }
        levels[r.session].totalUnits += (r.totalUnits || 0);
        levels[r.session].totalPoints += (r.totalPoints || 0);
    });

    const levelData = Object.values(levels).map(l => {
        const gpa = l.totalUnits > 0 ? parseFloat((l.totalPoints / l.totalUnits).toFixed(2)) : 0;
        
        let standing = 'Probation';
        if (gpa >= 4.50) standing = 'First Class';
        else if (gpa >= 3.50) standing = 'Second Class Upper';
        else if (gpa >= 2.40) standing = 'Second Class Lower';
        else if (gpa >= 1.50) standing = 'Third Class';
        else if (gpa >= 1.00) standing = 'Pass';

        return {
            session: l.session,
            gpa,
            totalUnits: l.totalUnits,
            totalPoints: l.totalPoints,
            standing
        };
    });

    // Sort by session ascending (e.g. 2022/2023 comes before 2023/2024)
    levelData.sort((a, b) => a.session.localeCompare(b.session));

    res.status(200).json(levelData);
});

module.exports = {
    calculateGPA,
    getCGPA,
    getResults,
    performGPACalculation,
    getLevelCGPA
};

