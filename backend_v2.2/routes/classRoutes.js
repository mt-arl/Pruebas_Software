const express = require('express');
const router = express.Router();
const sclassController = require('../controllers/class_Controller');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// CRUD de clases (solo admin)
router.post('/', verifyToken, verifyRole(['admin']), sclassController.createSclass);
router.get('/', verifyToken, sclassController.getAllSclasses);
router.get('/:id', verifyToken, sclassController.getSclassById);
router.put('/:id', verifyToken, verifyRole(['admin']), sclassController.updateSclass);
router.delete('/:id', verifyToken, verifyRole(['admin']), sclassController.deleteSclass);

// Matricular/desmatricular estudiantes (solo admin)
router.post('/:id/enroll', verifyToken, verifyRole(['admin']), sclassController.enrollStudent);
router.post('/:id/unenroll', verifyToken, verifyRole(['admin']), sclassController.unenrollStudent);

module.exports = router;

