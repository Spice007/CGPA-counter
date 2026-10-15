const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    registerAdmin,
    getStudentsData,
    saveBulkResults,
    cleanDuplicateCourses
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.get('/students', protect, getStudentsData);
router.post('/results/bulk', protect, saveBulkResults);
router.route('/clean-courses')
    .get(protect, cleanDuplicateCourses)
    .post(protect, cleanDuplicateCourses);

module.exports = router;
