const mongoose = require('mongoose');

const courseSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'Please add a course title']
    },
    code: {
        type: String,
        required: [true, 'Please add a course code']
    },
    unit: {
        type: Number,
        required: [true, 'Please add credit units']
    },
    grade: {
        type: String,
        required: [true, 'Please add a grade']
    },
    gradePoint: {
        type: Number,
        default: 0
    },
    session: String,
    semester: String
}, {
    timestamps: true
});

// Enforce unique course code per user, academic session, and semester
courseSchema.index({ user: 1, code: 1, session: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
