const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const newUser = new User({
      name: "Docente Uno",
      email: "teacher2@test.com",
      password: hashedPassword,
      role: "teacher"
    });

    await newUser.save();
    console.log("✅ Usuario creado correctamente.");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error al crear el usuario:", err);
  });
