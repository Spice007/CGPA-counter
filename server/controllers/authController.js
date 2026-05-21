const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/errorMiddleware');

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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
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

module.exports = {
    registerUser,
    loginUser,
    logoutUser
};
