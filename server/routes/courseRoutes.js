const express = require('express');
const router = express.Router();
const { getCourses, addCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCourses)
    .post(protect, addCourse);

router.route('/:id')
    .put(protect, updateCourse)
    .delete(protect, deleteCourse);

module.exports = router;
