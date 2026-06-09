const Course = require('../models/Course');
const { performGPACalculation } = require('./resultController');
const { asyncHandler } = require('../middleware/errorMiddleware');

const calculateGradePoint = (grade) => {
    const gradingScale = {
        'A': 5,
        'B': 4,
        'C': 3,
        'D': 2,
        'E': 1,
        'F': 0
    };
    return gradingScale[grade.toUpperCase()] || 0;
};

// @desc    Get all courses for logged in user
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
    const { session, semester } = req.query;
    let query = { user: req.user.id || req.user._id };

    if (session) query.session = session;
    if (semester) query.semester = semester;

    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.status(200).json(courses);
});

// @desc    Add a course
// @route   POST /api/courses
// @access  Private
const addCourse = asyncHandler(async (req, res) => {
    const { title, code, unit, grade, semester, session } = req.body;

    if (!title || !code || !unit || !grade || !semester || !session) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const course = await Course.create({
        user: req.user.id || req.user._id,
        title,
        code,
        unit: Number(unit),
        grade,
        gradePoint: calculateGradePoint(grade),
        semester,
        session
    });

    // Recalculate GPA for this semester
    await performGPACalculation(req.user.id || req.user._id, session, semester);

    res.status(201).json(course);
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private
const updateCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // Make sure logged in user matches course user
    if (course.user.toString() !== (req.user.id || req.user._id).toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Update fields
    course.title = req.body.title || course.title;
    course.code = req.body.code || course.code;
    course.unit = req.body.unit ? Number(req.body.unit) : course.unit;
    course.grade = req.body.grade || course.grade;
    course.semester = req.body.semester || course.semester;
    course.session = req.body.session || course.session;
    
    if (req.body.grade) {
        course.gradePoint = calculateGradePoint(req.body.grade);
    }

    const updatedCourse = await course.save();

    // Recalculate GPA for the (possibly new) semester and session
    await performGPACalculation(req.user.id || req.user._id, course.session, course.semester);

    res.status(200).json(updatedCourse);
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = asyncHandler(async (req, res) => {
    console.log(`[DELETE COURSE] Request to delete course ID: ${req.params.id}`);
    
    const course = await Course.findById(req.params.id);

    if (!course) {
        console.log(`[DELETE COURSE] Course ${req.params.id} not found in database. Returning success as it is already deleted.`);
        return res.status(200).json({ id: req.params.id, message: 'Course already deleted' });
    }

    const userIdStr = (req.user.id || req.user._id || '').toString();
    const courseOwnerStr = (course.user || '').toString();

    console.log(`[DELETE COURSE] Course owner: ${courseOwnerStr}, Logged-in user: ${userIdStr}`);

    // Make sure logged in user matches course user OR is an authorized admin
    const isAdmin = req.user && (
        req.user.role === 'superadmin' || 
        req.user.email === 'gideonlastgids@gmail.com'
    );

    if (courseOwnerStr !== userIdStr && !isAdmin) {
        console.warn(`[DELETE COURSE] Unauthorized delete attempt: User ${userIdStr} tried to delete course owned by ${courseOwnerStr}`);
        res.status(401);
        throw new Error('User not authorized to delete this course');
    }

    const { session, semester } = course;
    await course.deleteOne();
    console.log(`[DELETE COURSE] Course ${req.params.id} successfully deleted from database.`);

    // Recalculate GPA after deletion (for the owner of the course)
    try {
        await performGPACalculation(course.user, session, semester);
        console.log(`[DELETE COURSE] GPA recalculated for user ${course.user} (${session} - ${semester})`);
    } catch (gpaErr) {
        console.error('[DELETE COURSE] Error recalculating GPA after course deletion:', gpaErr.message);
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getCourses,
    addCourse,
    updateCourse,
    deleteCourse
};

