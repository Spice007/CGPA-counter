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

module.exports = mongoose.model('Course', courseSchema);
