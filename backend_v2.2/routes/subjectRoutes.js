const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// CRUD de materias (solo admin puede crear, editar y borrar)
router.post('/', verifyToken, verifyRole(['admin']), subjectController.createSubject);
router.get('/', verifyToken, subjectController.getAllSubjects);
router.get('/:id', verifyToken, subjectController.getSubjectById);
router.put('/:id', verifyToken, verifyRole(['admin']), subjectController.updateSubject);
router.delete('/:id', verifyToken, verifyRole(['admin']), subjectController.deleteSubject);

module.exports = router;