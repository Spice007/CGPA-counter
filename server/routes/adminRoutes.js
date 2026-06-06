const express = require('express');
const router = express.Router();
const { loginAdmin, registerAdmin, getStudentsData, saveBulkResults } = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');

// In a real app, protect these with an admin auth middleware
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.get('/students', protect, getStudentsData);
router.post('/results/bulk', protect, saveBulkResults);

module.exports = router;
