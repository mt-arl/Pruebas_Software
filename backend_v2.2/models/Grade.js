const mongoose = require('mongoose');
const { Schema, model, models } = require('mongoose');

const gradeSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  score: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });

// ✅ Compilar solo si aún no existe
module.exports = models.Grade || model('Grade', gradeSchema);
