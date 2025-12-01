const { Schema, model, models } = require('mongoose');

const subjectSchema = new Schema({
  subName: { type: String, required: true, unique: true }
});

// ✅ Solo compilar si aún no existe
module.exports = models.Subject || model('Subject', subjectSchema);


