const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    registerAdmin,
    getStudentsData,
    saveBulkResults,
    cleanDuplicateCourses,
    resetNonAdminEndpoint
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.get('/students', protect, getStudentsData);
router.post('/results/bulk', protect, saveBulkResults);
router.route('/clean-courses')
    .get(protect, cleanDuplicateCourses)
    .post(protect, cleanDuplicateCourses);
router.route('/reset-non-admin')
    .get(protect, resetNonAdminEndpoint)
    .post(protect, resetNonAdminEndpoint);

module.exports = router;
