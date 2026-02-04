require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const app = express();

// Seguridad HTTP headers
app.use(helmet());

// Previene ataques NoSQL Injection
app.use(mongoSanitize());

// Previene XSS en inputs
app.use(xss());

// CORS seguro
app.use(cors({
  origin: ["http://localhost:3000"], // tu frontend
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders:["Content-Type","Authorization"]
}));

// Rate limit para evitar ataques al login y register
const AuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10min
  max: 700,
  message:{ error: "Demasiados intentos, espere 10 minutos." }
});

app.use("/api/users/login", AuthLimiter);
app.use("/api/users/register", AuthLimiter);

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
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/reports', reportRoutes);

// 🔗 Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// 🚀 Si no es test → iniciar servidor
if (!process.env.JEST_WORKER_ID) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
}
app.get('/', (req, res) => res.send('API de Gestión Académica Funcionando'));
module.exports = app;


