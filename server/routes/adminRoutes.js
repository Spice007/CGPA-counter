const express = require('express');
const router = express.Router();
const { loginAdmin, registerAdmin, getStudentsData, saveBulkResults } = require('../controllers/adminController');

// In a real app, protect these with an admin auth middleware
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.get('/students', getStudentsData);
router.post('/results/bulk', saveBulkResults);

module.exports = router;
