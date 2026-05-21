const mongoose = require('mongoose');

const resultSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    session: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    gpa: {
        type: Number,
        default: 0
    },
    totalUnits: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    academicStanding: String
}, {
    timestamps: true
});

// Compound index to ensure unique results per user/session/semester
resultSchema.index({ user: 1, session: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
