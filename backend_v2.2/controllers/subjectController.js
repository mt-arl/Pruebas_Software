const { Schema, model } = require('mongoose');

const subjectSchema = new Schema({
subName: { type: String, required: true, unique: true }
});

module.exports = model('Subject', subjectSchema);


// backend/controllers/subjectController.js
const Subject = require('../models/subjectSchema');

// Crear materia
const createSubject = async (req, res) => {
try {
const { subName } = req.body;
const newSubject = new Subject({ subName });
await newSubject.save();
res.status(201).json(newSubject);
} catch (err) {
res.status(500).json({ message: 'Error creating subject', error: err.message });
}
};

// Obtener todas las materias
const getAllSubjects = async (req, res) => {
try {
const subjects = await Subject.find();
res.status(200).json(subjects);
} catch (err) {
res.status(500).json({ message: 'Error fetching subjects', error: err.message });
}
};

// Obtener materia por ID
const getSubjectById = async (req, res) => {
try {
const subject = await Subject.findById(req.params.id);
if (!subject) return res.status(404).json({ message: 'Subject not found' });
res.status(200).json(subject);
} catch (err) {
res.status(500).json({ message: 'Error fetching subject', error: err.message });
}
};

// Actualizar materia
const updateSubject = async (req, res) => {
try {
const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
if (!updated) return res.status(404).json({ message: 'Subject not found' });
res.status(200).json(updated);
} catch (err) {
res.status(500).json({ message: 'Error updating subject', error: err.message });
}
};

// Eliminar materia
const deleteSubject = async (req, res) => {
try {
const deleted = await Subject.findByIdAndDelete(req.params.id);
if (!deleted) return res.status(404).json({ message: 'Subject not found' });
res.status(200).json({ message: 'Subject deleted successfully' });
} catch (err) {
res.status(500).json({ message: 'Error deleting subject', error: err.message });
}
};

module.exports = {
createSubject,
getAllSubjects,
getSubjectById,
updateSubject,
deleteSubject
};