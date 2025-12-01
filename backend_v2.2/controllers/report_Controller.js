const User = require('../models/User');
const Sclass = require('../models/Sclass');
const Grade = require('../models/Grade');
const Subject = require('../models/subjectSchema');

const PDFDocument = require('pdfkit');

const generateReportPDF = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Validación: estudiante solo puede ver su reporte
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Buscar datos del estudiante
    const student = await User.findById(studentId).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Buscar clases matriculadas (Sclass donde esté el estudiante)
    const classes = await Sclass.find({ students: studentId })
      .populate('subject', 'subName')
      .populate('teacher', 'name email');

    // Buscar todas las calificaciones del estudiante
    const grades = await Grade.find({ student: studentId })
      .populate('subject', 'subName');

    // Crear PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${student.name}_report.pdf`,
        'Content-Length': pdfData.length,
      });
      res.end(pdfData);
    });

    // Documento
    doc.fontSize(20).text('Reporte Académico', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Estudiante: ${student.name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Rol: ${student.role}`);
    doc.moveDown();

    doc.fontSize(16).text('Clases Matriculadas:');
    classes.forEach((cls, i) => {
      doc.fontSize(14).text(`${i + 1}. Clase: ${cls.sclassName}`);
      doc.text(`   Materia: ${cls.subject.subName}`);
      doc.text(`   Profesor: ${cls.teacher.name} (${cls.teacher.email})`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(16).text('Calificaciones:');
    if (grades.length === 0) {
      doc.fontSize(14).text('No hay calificaciones registradas.');
    } else {
      grades.forEach((grade, i) => {
        doc.fontSize(14).text(`${i + 1}. Materia: ${grade.subject.subName}`);
        doc.text(`   Nota: ${grade.score}`);
        doc.moveDown(0.5);
      });
    }

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
};

module.exports = {
  generateReportPDF
};
