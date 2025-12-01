const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ======================= REGISTER =======================
const register = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Campos obligatorios" });

    if (password.length < 8)
      return res.status(400).json({ error: "Min 8 caracteres" });

      // Sanitizar texto (XSS friendly)
    name = name.trim().replace(/<[^>]*>?/gm, '');

    // Hash Password seguro
    const salt = await bcrypt.genSalt(12);
    password = await bcrypt.hash(password, salt); 

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ message: "Usuario registrado con éxito" });

  } catch {
    return res.status(400).json({ error: "El correo ya está en uso" });
  }
};

// ======================= LOGIN =======================
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h", algorithm: "HS256" }
  );

  res.json({ token });
};

// ======================= PERFIL =======================
const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

// ======================= AGREGAR NOTA (teacher/admin) =======================
const addGrade = async (req, res) => {
  const { subject, score } = req.body;
  const student = await User.findById(req.params.studentId);

  if (!student) return res.status(404).json({ error: "Estudiante no existe" });

  student.grades.push({ subject, score });
  await student.save();

  res.json({ message: "Nota asignada", student });
};

// ======================= ADMIN → LISTA TODOS =======================
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// ======================= ADMIN → ELIMINAR USUARIO =======================
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "Usuario no existe" });
  res.json({ message: "Usuario eliminado" });
};

module.exports = { register, login, getProfile, addGrade, getAllUsers, deleteUser };
