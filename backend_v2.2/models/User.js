const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }, // bcrypt
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },

  // Datos específicos
  grades: [{ subject: String, score: Number }],      // Solo student
  subjects: [String],                                // Solo teacher
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }] // Teacher/Admin
});

module.exports = mongoose.model('User', userSchema);
