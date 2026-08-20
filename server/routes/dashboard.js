const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', dashboardController.getSummary);
router.get('/revenue', dashboardController.getRevenue);
router.get('/pipeline', dashboardController.getPipeline);
router.get('/performance', dashboardController.getPerformance);
router.get('/charts', dashboardController.getCharts);

module.exports = router;