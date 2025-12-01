const mongoose = require('mongoose');
const { Schema } = mongoose;

const enrollmentSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }
});

enrollmentSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
