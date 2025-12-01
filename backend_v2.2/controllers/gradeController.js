const Grade = require('../models/Grade');
const User = require('../models/User');

// 📌 Registrar nota (admin o teacher)
const createGrade = async (req, res) => {
  try {
    const { student, subject, score } = req.body;

    const user = await User.findById(student);
    if (!user || user.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student ID or not a student' });
    }

    const newGrade = new Grade({ student, subject, score });
    await newGrade.save();

    res.status(201).json(newGrade);
  } catch (err) {
    res.status(500).json({ message: 'Error creating grade', error: err.message });
  }
};

// 📥 Obtener todas las notas (admin/teacher ve todas, student ve solo las suyas)
const getAllGrades = async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};

    const grades = await Grade.find(filter)
      .populate('student', 'email')
      .populate('subject', 'subName');

    res.status(200).json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message });
  }
};

// 📘 Obtener nota por ID
const getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'email')
      .populate('subject', 'subName');

    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    // Si es estudiante, puede ver solo sus propias notas
    if (req.user.role === 'student' && grade.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(grade);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grade', error: err.message });
  }
};

// ✏️ Actualizar nota (solo admin o teacher)
const updateGrade = async (req, res) => {
  try {
    const updated = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) return res.status(404).json({ message: 'Grade not found' });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating grade', error: err.message });
  }
};

// 🗑️ Eliminar nota (solo admin o teacher)
const deleteGrade = async (req, res) => {
  try {
    const deleted = await Grade.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Grade not found' });

    res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting grade', error: err.message });
  }
};

// 📊 Calcular promedio de estudiante
const getStudentAverage = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.find({ student: studentId });

    if (grades.length === 0) {
      return res.status(404).json({ message: 'No grades found for this student' });
    }

    const total = grades.reduce((acc, grade) => acc + grade.score, 0);
    const average = total / grades.length;

    res.status(200).json({ student: studentId, average, count: grades.length });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating average', error: err.message });
  }
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getStudentAverage
};
