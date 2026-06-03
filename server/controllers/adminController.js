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
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
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
        const students = await User.find({}).select('-password');
        const courses = await Course.find({});
        const results = await Result.find({});

        // Map data together into a flat structure suitable for spreadsheet
        const spreadsheetData = [];

        students.forEach(student => {
            const studentCourses = courses.filter(c => c.user.toString() === student._id.toString());
            const studentResults = results.filter(r => r.user.toString() === student._id.toString());
            
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
                    const gpMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
                    const gp = c.gradePoint !== undefined ? c.gradePoint : (gpMap[c.grade.toUpperCase()] || 0);
                    totalUnits += c.unit;
                    totalPoints += (c.unit * gp);
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
        const { updates } = req.body; // Array of updated rows
        const bulkCourseOps = [];
        
        for (let row of updates) {
            let studentId = row.studentId;
            
            // If studentId is missing but we have matricNumber and fullName, find or create student
            if (!studentId && row.matricNumber && row.fullName) {
                let student = await User.findOne({ matricNumber: row.matricNumber });
                if (student) {
                    studentId = student._id;
                } else {
                    // Create a new student user
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
                                code: row.courseCode,
                                title: row.courseTitle,
                                unit: row.unit,
                                score: row.score || 0,
                                grade: row.grade,
                                gradePoint: row.gradePoint
                            }
                        }
                    }
                });
            } else if (studentId && row.courseCode) {
                // Insert new course if courseCode is provided
                bulkCourseOps.push({
                    insertOne: {
                        document: {
                            user: studentId,
                            code: row.courseCode,
                            title: row.courseTitle || 'Unknown Title',
                            unit: row.unit || 0,
                            score: row.score || 0,
                            grade: row.grade || 'F',
                            gradePoint: row.gradePoint || 0,
                            session: row.session || '2023/2024',
                            semester: row.semester || '1st Semester'
                        }
                    }
                });
            }
            
            // Update student demographics
            if (studentId) {
                await User.findByIdAndUpdate(studentId, {
                    fullName: row.fullName,
                    matricNumber: row.matricNumber,
                    department: row.department,
                    academicSession: row.level
                });
            }
        }

        if (bulkCourseOps.length > 0) {
            await Course.bulkWrite(bulkCourseOps);
        }

        // Trigger GPA / CGPA recalculations for students who had their records updated
        // For each updated student, we can compute semester GPAs and update their Results collection
        const updatedStudentIds = [...new Set(updates.map(row => row.studentId).filter(Boolean))];
        for (let sId of updatedStudentIds) {
            // Find all courses for this student
            const studentCourses = await Course.find({ user: sId });
            
            // Group by session and semester
            const semGroup = {};
            studentCourses.forEach(c => {
                const key = `${c.session}_${c.semester}`;
                if (!semGroup[key]) {
                    semGroup[key] = { session: c.session, semester: c.semester, courses: [] };
                }
                semGroup[key].courses.push(c);
            });
            
            // Calculate GPA for each semester and upsert Result model
            for (let key of Object.keys(semGroup)) {
                const { session, semester, courses } = semGroup[key];
                let totalUnits = 0;
                let totalPoints = 0;
                
                courses.forEach(c => {
                    totalUnits += c.unit;
                    totalPoints += (c.unit * c.gradePoint);
                });
                
                const gpa = totalUnits > 0 ? parseFloat((totalPoints / totalUnits).toFixed(2)) : 0;
                
                // Find and update or create Result
                await Result.findOneAndUpdate(
                    { user: sId, session, semester },
                    { gpa },
                    { upsert: true, new: true }
                );
            }
        }
        
        res.json({ message: 'Bulk update and GPA calculation successful', count: updates.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginAdmin, registerAdmin, getStudentsData, saveBulkResults };
