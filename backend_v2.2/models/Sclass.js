const { Schema, model, models } = require('mongoose');

const sclassSchema = new Schema({
  sclassName: { type: String, required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = models.Sclass || model('Sclass', sclassSchema);
