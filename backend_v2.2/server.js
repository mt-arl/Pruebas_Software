require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// 🛡️ Middleware general
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json()); // ⚠️ Necesario para leer req.body

// 📦 Importación de rutas
const userRoutes = require('./routes/user_routes');
const gradeRoutes = require('./routes/gradeRoutes');
const classRoutes = require('./routes/classRoutes');        // ✅ Estaba faltando
const subjectRoutes = require('./routes/subjectRoutes');
const reportRoutes = require('./routes/report_routes');

// 🔐 Registro de rutas API
app.use('/api/users', userRoutes);
app.use('/api/class', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/reports', reportRoutes);

// 🔗 Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// 🏁 Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

