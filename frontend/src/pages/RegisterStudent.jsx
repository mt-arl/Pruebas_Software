import React, { useState } from "react";
import axios from "axios";

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    cedula: "",
    birthDate: "",
    course: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { firstName, lastName, cedula, birthDate, course, email, password } = formData;

    if (!firstName || !lastName || !cedula || !birthDate || !course || !email || !password) {
      return "Todos los campos son obligatorios.";
    }

    if (!/^\d{10}$/.test(cedula)) {
      return "La cédula debe tener 10 dígitos numéricos.";
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "El correo no es válido.";
    }

    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/students/register`, formData);
      setSuccess("Estudiante registrado correctamente.");
      setFormData({
        firstName: "",
        lastName: "",
        cedula: "",
        birthDate: "",
        course: "",
        email: "",
        password: ""
      });
    } catch (err) {
      setError("Error al registrar. Verifica que el correo o la cédula no estén registrados.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Registro Estudiantil</h2>

        {error && <p className="text-red-600 text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}

        <div className="flex gap-2">
          <input
            type="text"
            name="firstName"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            className="w-1/2 border p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            className="w-1/2 border p-2 rounded"
          />
        </div>

        <input
          type="text"
          name="cedula"
          placeholder="Cédula"
          value={formData.cedula}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <select
          name="course"
          value={formData.course}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Seleccionar curso</option>
          <option value="Inicial I">Inicial I</option>
          <option value="Inicial II">Inicial II</option>
          <option value="Primero EGB">Primero EGB</option>
          <option value="Segundo EGB">Segundo EGB</option>
          <option value="Tercero EGB">Tercero EGB</option>
          <option value="Cuarto EGB">Cuarto EGB</option>
          <option value="Quinto EGB">Quinto EGB</option>
          <option value="Sexto EGB">Sexto EGB</option>
          <option value="Séptimo EGB">Séptimo EGB</option>
          <option value="Octavo EGB">Octavo EGB</option>
          <option value="Noveno EGB">Noveno EGB</option>
          <option value="Décimo EGB">Décimo EGB</option>
          <option value="1BGU">1BGU</option>
          <option value="2BGU">2BGU</option>
          <option value="3BGU">3BGU</option>
        </select>

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default RegisterStudent;
