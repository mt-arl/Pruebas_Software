const express = require('express');
const router = express.Router();
const {
  login,
  getProfile,
  addGrade,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');

const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
//Registrarse
const { register } = require('../controllers/userController');
router.post('/register', register);

// Login público
router.post('/login', login);

// Ver perfil propio
router.get('/me', verifyToken, getProfile);

// Teacher/Admin puede agregar notas
router.post('/:studentId/grades', verifyToken, verifyRole(['teacher', 'admin']), addGrade);

// Admin total
router.get('/', verifyToken, verifyRole(['admin']), getAllUsers);
router.delete('/:id', verifyToken, verifyRole(['admin']), deleteUser);


module.exports = router;


