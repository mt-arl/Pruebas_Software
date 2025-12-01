const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// CRUD de notas
router.post('/', verifyToken, verifyRole(['admin', 'teacher']), gradeController.createGrade);
router.get('/', verifyToken, gradeController.getAllGrades);
router.get('/:id', verifyToken, gradeController.getGradeById);
router.put('/:id', verifyToken, verifyRole(['admin', 'teacher']), gradeController.updateGrade);
router.delete('/:id', verifyToken, verifyRole(['admin', 'teacher']), gradeController.deleteGrade);

// Promedio de estudiante
router.get('/average/:id', verifyToken, gradeController.getStudentAverage);

module.exports = router;


