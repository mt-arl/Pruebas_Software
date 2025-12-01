const Sclass = require('../models/Sclass');
const User = require('../models/User');

// 📌 Crear clase (solo admin)
const createSclass = async (req, res) => {
try {
const { sclassName, subject, teacher } = req.body;

// Validar profesor
const prof = await User.findById(teacher);
if (!prof || prof.role !== 'teacher') {
  return res.status(400).json({ message: 'Invalid teacher ID or not a teacher' });
}

const newClass = new Sclass({ sclassName, subject, teacher });
await newClass.save();

res.status(201).json(newClass);
} catch (err) {
res.status(500).json({ message: 'Error creating class', error: err.message });
}
};

// 📥 Obtener todas las clases (admin ve todo, teacher ve las suyas, student ve las inscritas)
const getAllSclasses = async (req, res) => {
try {
let filter = {};


if (req.user.role === 'teacher') {
  filter.teacher = req.user.id;
} else if (req.user.role === 'student') {
  filter.students = req.user.id;
}

const classes = await Sclass.find(filter)
  .populate('subject', 'subName')
  .populate('teacher', 'email')
  .populate('students', 'email');

res.status(200).json(classes);
} catch (err) {
res.status(500).json({ message: 'Error fetching classes', error: err.message });
}
};

// 📘 Obtener clase por ID
const getSclassById = async (req, res) => {
try {
const sclass = await Sclass.findById(req.params.id)
.populate('subject', 'subName')
.populate('teacher', 'email')
.populate('students', 'email');


if (!sclass) return res.status(404).json({ message: 'Class not found' });

res.status(200).json(sclass);
} catch (err) {
res.status(500).json({ message: 'Error fetching class', error: err.message });
}
};

// ✏️ Actualizar clase (solo admin)
const updateSclass = async (req, res) => {
try {
const updated = await Sclass.findByIdAndUpdate(req.params.id, req.body, { new: true });
if (!updated) return res.status(404).json({ message: 'Class not found' });


res.status(200).json(updated);
} catch (err) {
res.status(500).json({ message: 'Error updating class', error: err.message });
}
};

// 🗑️ Eliminar clase (solo admin)
const deleteSclass = async (req, res) => {
try {
const deleted = await Sclass.findByIdAndDelete(req.params.id);
if (!deleted) return res.status(404).json({ message: 'Class not found' });

res.status(200).json({ message: 'Class deleted successfully' });
} catch (err) {
res.status(500).json({ message: 'Error deleting class', error: err.message });
}
};

// ➕ Matricular estudiante (solo admin)
const enrollStudent = async (req, res) => {
try {
const { studentId } = req.body;
const sclass = await Sclass.findById(req.params.id);
if (!sclass) return res.status(404).json({ message: 'Class not found' });


const student = await User.findById(studentId);
if (!student || student.role !== 'student') {
  return res.status(400).json({ message: 'Invalid student ID or not a student' });
}

if (sclass.students.includes(studentId)) {
  return res.status(400).json({ message: 'Student already enrolled in class' });
}

sclass.students.push(studentId);
await sclass.save();

res.status(200).json({ message: 'Student enrolled', class: sclass });
} catch (err) {
res.status(500).json({ message: 'Error enrolling student', error: err.message });
}
};

// ➖ Desmatricular estudiante (solo admin)
const unenrollStudent = async (req, res) => {
try {
const { studentId } = req.body;
const sclass = await Sclass.findById(req.params.id);
if (!sclass) return res.status(404).json({ message: 'Class not found' });


const wasEnrolled = sclass.students.includes(studentId);
if (!wasEnrolled) {
  return res.status(400).json({ message: 'Student is not enrolled in this class' });
}

sclass.students = sclass.students.filter(id => id.toString() !== studentId);
await sclass.save();

res.status(200).json({ message: 'Student unenrolled', class: sclass });
} catch (err) {
res.status(500).json({ message: 'Error unenrolling student', error: err.message });
}
};

module.exports = {
createSclass,
getAllSclasses,
getSclassById,
updateSclass,
deleteSclass,
enrollStudent,
unenrollStudent
};