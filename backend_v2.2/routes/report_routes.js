const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report_Controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Generar reporte PDF por estudiante
router.get('/student/:id', verifyToken, reportController.generateReportPDF);

module.exports = router;
