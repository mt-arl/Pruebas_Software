const User = require('../models/User');
const bcrypt = require('bcrypt');

// 🔓 Login
const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Access denied: role mismatch or not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Login error', err });
  }
};

// 📄 Ver perfil propio
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', err });
  }
};

// 👨‍🏫 Agregar nota (teacher/admin)
const addGrade = async (req, res) => {
  const { studentId } = req.params;
  const { subject, score } = req.body;

  try {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.grades.push({ subject, score });
    await student.save();

    res.status(200).json({ message: 'Grade added', grades: student.grades });
  } catch (err) {
    res.status(500).json({ message: 'Error adding grade', err });
  }
};

// 🔄 CRUD adicional para admin
const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json(users);
};

const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete error', err });
  }
};

const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { email, password, role, name } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    // Guardamos el name también aquí
    const user = new User({ email, password: hashed, role, name });
    await user.save();

    // Incluyo name en el payload del token, si quieres usarlo luego
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Register error', err });
  }
};


module.exports = {
  login,
  getProfile,
  addGrade,
  getAllUsers,
  deleteUser,
  register
};

