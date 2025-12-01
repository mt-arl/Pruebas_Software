// models/Report.js
// Opcional, no obligatorio para generación dinámica de reportes

const { Schema, model, models } = require('mongoose');

const reportSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  data: { type: Schema.Types.Mixed } // Puede guardar JSON con el reporte
});

module.exports = models.Report || model('Report', reportSchema);
