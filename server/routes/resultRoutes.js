const express = require('express');
const router = express.Router();
const { calculateGPA, getCGPA, getResults, getLevelCGPA } = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getResults);
router.get('/levels', protect, getLevelCGPA);
router.post('/calculate', protect, calculateGPA);
router.get('/cgpa', protect, getCGPA);

module.exports = router;
