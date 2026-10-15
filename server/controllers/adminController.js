const Admin = require('../models/Admin');
const User = require('../models/User');
const Course = require('../models/Course');
const Result = require('../models/Result');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const cleanUser = (username || '').trim();

        // 1. Check in Admin collection by username or email
        const admin = await Admin.findOne({
            $or: [
                { username: cleanUser },
                { email: cleanUser.toLowerCase() }
            ]
        });

        if (admin && (await admin.matchPassword(password))) {
            return res.json({
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id),
            });
        }

        // 2. Check if superadmin user exists in User collection
        const user = await User.findOne({
            email: cleanUser.toLowerCase()
        });

        if (user && user.email === 'gideonlastgids@gmail.com' && user.password && (await user.matchPassword(password))) {
            return res.json({
                _id: user._id,
                username: user.fullName || 'Super Admin',
                email: user.email,
                role: 'superadmin',
                token: generateToken(user._id),
            });
        }

        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new admin (temp route for setup)
// @route   POST /api/admin/register
const registerAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const adminExists = await Admin.findOne({ username });

        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await Admin.create({ username, email, password });
        res.status(201).json({ _id: admin._id, username: admin.username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all students with their full academic records for spreadsheet
// @route   GET /api/admin/students
const getStudentsData = async (req, res) => {
    try {
        const isAuthorized = req.user && (
            req.user.role === 'superadmin' ||
            req.user.email === 'gideonlastgids@gmail.com'
        );
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const [students, courses, results] = await Promise.all([
            User.find({}).select('-password').lean(),
            Course.find({}).lean(),
            Result.find({}).lean()
        ]);

        // Pre-group courses and results by user ID for O(1) instant lookup
        const coursesByUser = new Map();
        for (const c of courses) {
            const uid = c.user ? c.user.toString() : '';
            if (!coursesByUser.has(uid)) coursesByUser.set(uid, []);
            coursesByUser.get(uid).push(c);
        }

        const resultsByUser = new Map();
        for (const r of results) {
            const uid = r.user ? r.user.toString() : '';
            if (!resultsByUser.has(uid)) resultsByUser.set(uid, []);
            resultsByUser.get(uid).push(r);
        }

        const gpMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
        const spreadsheetData = [];

        students.forEach(student => {
            const sIdStr = student._id.toString();
            const studentCourses = coursesByUser.get(sIdStr) || [];
            const studentResults = resultsByUser.get(sIdStr) || [];
            
            if (studentCourses.length === 0) {
                // Return basic student row if no courses
                spreadsheetData.push({
                    studentId: student._id,
                    fullName: student.fullName,
                    email: student.email || 'N/A',
                    matricNumber: student.matricNumber || 'N/A',
                    department: student.department || 'N/A',
                    faculty: student.faculty || student.department || 'N/A',
                    university: student.university || 'N/A',
                    level: student.academicSession || 'N/A',
                    profilePicture: student.profilePicture || null,
                    lastLogin: student.lastLogin || null,
                    createdAt: student.createdAt || null,
                    courseCode: '',
                    courseTitle: '',
                    unit: 0,
                    grade: '',
                    gradePoint: 0,
                    semester: '',
                    gpa: 0,
                    cgpa: 0
                });
            } else {
                // Calculate CGPA across all student courses
                let totalUnits = 0;
                let totalPoints = 0;
                studentCourses.forEach(c => {
                    const gp = c.gradePoint !== undefined ? c.gradePoint : (gpMap[(c.grade || '').toUpperCase()] || 0);
                    const u = Number(c.unit) || 0;
                    totalUnits += u;
                    totalPoints += (u * gp);
                });
                const cgpa = totalUnits > 0 ? parseFloat((totalPoints / totalUnits).toFixed(2)) : 0;

                studentCourses.forEach(course => {
                    const result = studentResults.find(r => r.session === course.session && r.semester === course.semester);
                    
                    spreadsheetData.push({
                        studentId: student._id,
                        fullName: student.fullName,
                        email: student.email || 'N/A',
                        matricNumber: student.matricNumber || 'N/A',
                        department: student.department || 'N/A',
                        faculty: student.faculty || student.department || 'N/A',
                        university: student.university || 'N/A',
                        level: student.academicSession || 'N/A',
                        profilePicture: student.profilePicture || null,
                        lastLogin: student.lastLogin || null,
                        createdAt: student.createdAt || null,
                        courseId: course._id,
                        courseCode: course.code,
                        courseTitle: course.title,
                        unit: course.unit,
                        score: course.score || 0,
                        grade: course.grade,
                        gradePoint: course.gradePoint,
                        semester: course.semester,
                        session: course.session,
                        gpa: result ? result.gpa : 0,
                        cgpa: cgpa
                    });
                });
            }
        });

        res.json(spreadsheetData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk save results from spreadsheet
// @route   POST /api/admin/results/bulk
const saveBulkResults = async (req, res) => {
    try {
        const isAuthorized = req.user && (
            req.user.role === 'superadmin' ||
            req.user.email === 'gideonlastgids@gmail.com'
        );
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const { updates } = req.body; // Array of updated rows
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.json({ message: 'No updates provided', count: 0 });
        }

        const bulkCourseOps = [];
        const affectedStudentIds = new Set();
        
        for (let row of updates) {
            let studentId = row.studentId;
            
            // If studentId is missing but we have matricNumber and fullName, find or create student
            if (!studentId && row.matricNumber && row.fullName) {
                let student = await User.findOne({ matricNumber: row.matricNumber });
                if (student) {
                    studentId = student._id;
                } else {
                    const email = row.matricNumber.toLowerCase().replace(/[^a-z0-9]/g, '') + '@school.edu';
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash('password123', salt);
                    
                    student = await User.create({
                        fullName: row.fullName,
                        email: email,
                        password: hashedPassword,
                        matricNumber: row.matricNumber,
                        department: row.department || 'N/A',
                        academicSession: row.level || '2023/2024'
                    });
                    studentId = student._id;
                }
            }
            
            if (row.courseId) {
                // Update existing course
                bulkCourseOps.push({
                    updateOne: {
                        filter: { _id: row.courseId },
                        update: {
                            $set: {
                                code: (row.courseCode || '').toUpperCase().trim(),
                                title: row.courseTitle,
                                unit: Number(row.unit) || 0,
                                score: row.score !== undefined && row.score !== null && row.score !== '' ? Number(row.score) : 0,
                                grade: row.grade || 'F',
                                gradePoint: Number(row.gradePoint) || 0
                            }
                        }
                    }
                });
                if (studentId) affectedStudentIds.add(studentId.toString());
            } else if (studentId && row.courseCode) {
                // CRITICAL SAFETY GUARD:
                // Only insert or upsert a new course if a genuine score was entered or non-F grade exists!
                // This stops the spreadsheet from broadcasting ghost empty columns to every student!
                const hasValidScore = row.score !== undefined && row.score !== null && row.score !== '';
                const hasValidGrade = row.grade && row.grade !== 'F';

                if (hasValidScore || hasValidGrade) {
                    const normCode = row.courseCode.toUpperCase().trim();
                    const normSession = row.session || '2023/2024';
                    const normSemester = row.semester || '1st Semester';

                    // Atomic upsert ensures NO DUPLICATES can ever be created
                    bulkCourseOps.push({
                        updateOne: {
                            filter: {
                                user: studentId,
                                code: normCode,
                                session: normSession,
                                semester: normSemester
                            },
                            update: {
                                $set: {
                                    user: studentId,
                                    code: normCode,
                                    title: row.courseTitle || `${normCode} Course`,
                                    unit: Number(row.unit) || 0,
                                    score: hasValidScore ? Number(row.score) : 0,
                                    grade: row.grade || 'F',
                                    gradePoint: Number(row.gradePoint) || 0,
                                    session: normSession,
                                    semester: normSemester
                                }
                            },
                            upsert: true
                        }
                    });
                    affectedStudentIds.add(studentId.toString());
                }
            }
            
            // Update student demographics if provided
            if (studentId && (row.fullName || row.matricNumber || row.department || row.level)) {
                const updateDoc = {};
                if (row.fullName) updateDoc.fullName = row.fullName;
                if (row.matricNumber) updateDoc.matricNumber = row.matricNumber;
                if (row.department) updateDoc.department = row.department;
                if (row.level) updateDoc.academicSession = row.level;
                await User.findByIdAndUpdate(studentId, updateDoc);
            }
        }

        if (bulkCourseOps.length > 0) {
            await Course.bulkWrite(bulkCourseOps);
        }

        // Trigger GPA / CGPA recalculations for students who had their records updated
        const { performGPACalculation } = require('./resultController');
        for (let sId of affectedStudentIds) {
            const studentCourses = await Course.find({ user: sId });
            const semGroup = new Set();
            studentCourses.forEach(c => {
                if (c.session && c.semester) {
                    semGroup.add(`${c.session}___${c.semester}`);
                }
            });
            for (let pair of semGroup) {
                const [session, semester] = pair.split('___');
                await performGPACalculation(sId, session, semester);
            }
        }
        
        res.json({ message: 'Bulk update and GPA calculation successful', count: updates.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reusable core routine to purge phantom auto-saved courses, deduplicate, and recalculate GPAs
const executeCourseCleanup = async () => {
    console.log('🧹 [Course Cleanup] Starting comprehensive course cleanup & deduplication...');

    // 1. Delete phantom dummy courses created by spreadsheet auto-save bug:
    // (session 2023/2024, 1st Semester, grade F, gradePoint 0, score 0/null, title ending in "Course" or "Unknown Title")
    const phantomQuery = {
        session: '2023/2024',
        semester: '1st Semester',
        grade: 'F',
        gradePoint: 0,
        $and: [
            {
                $or: [
                    { score: 0 },
                    { score: { $exists: false } },
                    { score: null }
                ]
            },
            {
                $or: [
                    { title: { $regex: /\bCourse$/i } },
                    { title: 'Unknown Title' }
                ]
            }
        ]
    };

    const phantomRes = await Course.deleteMany(phantomQuery);
    console.log(`🧹 [Course Cleanup] Deleted ${phantomRes.deletedCount} phantom auto-save courses.`);

    // 2. Identify and remove any remaining duplicates:
    // Group by (user, uppercase code, session, semester)
    const duplicateGroups = await Course.aggregate([
        {
            $group: {
                _id: {
                    user: "$user",
                    code: { $toUpper: "$code" },
                    session: "$session",
                    semester: "$semester"
                },
                count: { $sum: 1 },
                docs: {
                    $push: {
                        _id: "$_id",
                        score: "$score",
                        grade: "$grade",
                        gradePoint: "$gradePoint",
                        createdAt: "$createdAt"
                    }
                }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ]);

    const duplicateIdsToDelete = [];
    for (const group of duplicateGroups) {
        // Sort so the best record is kept at index 0:
        // 1. Highest gradePoint
        // 2. Highest score
        // 3. Oldest genuine document
        group.docs.sort((a, b) => {
            const gpA = a.gradePoint || 0;
            const gpB = b.gradePoint || 0;
            if (gpA !== gpB) return gpB - gpA;
            const scA = a.score || 0;
            const scB = b.score || 0;
            if (scA !== scB) return scB - scA;
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

        // Delete all duplicate copies (index 1 to end)
        for (let i = 1; i < group.docs.length; i++) {
            duplicateIdsToDelete.push(group.docs[i]._id);
        }
    }

    let dedupDeletedCount = 0;
    if (duplicateIdsToDelete.length > 0) {
        const dedupRes = await Course.deleteMany({ _id: { $in: duplicateIdsToDelete } });
        dedupDeletedCount = dedupRes.deletedCount;
        console.log(`🧹 [Course Cleanup] Deleted ${dedupDeletedCount} duplicate courses.`);
    }

    // 3. Recalculate GPAs for all users with courses or existing results
    const { performGPACalculation } = require('./resultController');
    const distinctCourseUsers = await Course.distinct('user');
    const distinctResultUsers = await Result.distinct('user');
    const allUsers = [...new Set([...distinctCourseUsers.map(String), ...distinctResultUsers.map(String)])];

    for (const uId of allUsers) {
        try {
            const userCourses = await Course.find({ user: uId });
            const semPairs = new Set();
            userCourses.forEach(c => {
                if (c.session && c.semester) {
                    semPairs.add(`${c.session}___${c.semester}`);
                }
            });

            const existingResults = await Result.find({ user: uId });
            existingResults.forEach(r => {
                if (r.session && r.semester) {
                    semPairs.add(`${r.session}___${r.semester}`);
                }
            });

            for (const pair of semPairs) {
                const [session, semester] = pair.split('___');
                await performGPACalculation(uId, session, semester);
            }
        } catch (calcErr) {
            console.warn(`Error recalculating GPA for user ${uId}:`, calcErr.message);
        }
    }

    // 4. Safely create or ensure compound unique index
    try {
        await Course.collection.createIndex(
            { user: 1, code: 1, session: 1, semester: 1 },
            { unique: true }
        );
        console.log('✅ [Course Cleanup] Unique compound index successfully established on Course collection.');
    } catch (indexErr) {
        console.warn('⚠️ [Course Cleanup] Unique index creation warning:', indexErr.message);
    }

    const remainingCourses = await Course.countDocuments();
    const totalDeleted = phantomRes.deletedCount + dedupDeletedCount;
    console.log(`🎉 [Course Cleanup] Completed! Purged: ${totalDeleted} courses. Remaining legitimate courses: ${remainingCourses}`);

    return {
        phantomDeleted: phantomRes.deletedCount,
        duplicatesDeleted: dedupDeletedCount,
        totalDeleted,
        remainingCourses,
        recalculatedUsersCount: allUsers.length
    };
};

// @desc    Admin endpoint to trigger cleanup manually
// @route   POST /api/admin/clean-courses
// @route   GET  /api/admin/clean-courses
const cleanDuplicateCourses = async (req, res) => {
    try {
        const isAuthorized = req.user && (
            req.user.role === 'superadmin' ||
            req.user.email === 'gideonlastgids@gmail.com'
        );
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const result = await executeCourseCleanup();
        res.json({
            message: 'Course cleanup and GPA recalculation completed successfully',
            ...result
        });
    } catch (error) {
        console.error('Course cleanup error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset all accounts and their details except gideonlastgids@gmail.com
const resetNonAdminUsers = async () => {
    try {
        const ADMIN_EMAIL = 'gideonlastgids@gmail.com';
        
        // Find all non-admin users
        const nonAdminUsers = await User.find({ email: { $ne: ADMIN_EMAIL } });
        const nonAdminIds = nonAdminUsers.map(u => u._id);

        let delCoursesCount = 0;
        let delResultsCount = 0;
        let delGoogleCount = 0;

        if (nonAdminIds.length > 0) {
            // Delete all courses belonging to non-admin accounts
            const delCourses = await Course.deleteMany({ user: { $in: nonAdminIds } });
            delCoursesCount = delCourses.deletedCount || 0;

            // Delete all results belonging to non-admin accounts
            const delResults = await Result.deleteMany({ user: { $in: nonAdminIds } });
            delResultsCount = delResults.deletedCount || 0;

            // Delete non-admin Google users completely so they are created fresh as brand new users on next sign-in
            const delGoogle = await User.deleteMany({
                email: { $ne: ADMIN_EMAIL },
                $or: [{ authProvider: 'google' }, { googleId: { $ne: null } }]
            });
            delGoogleCount = delGoogle.deletedCount || 0;

            // For any remaining non-admin users (e.g. local email/password), reset their registration details to empty
            await User.updateMany(
                { email: { $ne: ADMIN_EMAIL } },
                {
                    $set: {
                        matricNumber: '',
                        faculty: '',
                        department: '',
                        university: '',
                        academicSession: '2023/2024'
                    }
                }
            );

            console.log(`🧹 [User Reset] Reset non-admin accounts. Users: ${nonAdminIds.length}, Courses purged: ${delCoursesCount}, Results purged: ${delResultsCount}, Google accounts reset: ${delGoogleCount}`);
        } else {
            console.log('ℹ️ [User Reset] No non-admin accounts found to reset.');
        }

        return {
            usersProcessed: nonAdminIds.length,
            coursesDeleted: delCoursesCount,
            resultsDeleted: delResultsCount,
            googleUsersDeleted: delGoogleCount
        };
    } catch (err) {
        console.error('⚠️ [User Reset] Error resetting non-admin users:', err.message);
        throw err;
    }
};

// @desc    Admin endpoint to trigger user reset
// @route   POST /api/admin/reset-non-admin
// @route   GET  /api/admin/reset-non-admin
const resetNonAdminEndpoint = async (req, res) => {
    try {
        const isAuthorized = req.user && (
            req.user.role === 'superadmin' ||
            req.user.email === 'gideonlastgids@gmail.com'
        );
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized as superadmin' });
        }

        const stats = await resetNonAdminUsers();
        res.json({
            message: 'All accounts except gideonlastgids@gmail.com have been reset to new users.',
            ...stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginAdmin,
    registerAdmin,
    getStudentsData,
    saveBulkResults,
    cleanDuplicateCourses,
    executeCourseCleanup,
    resetNonAdminUsers,
    resetNonAdminEndpoint
};
