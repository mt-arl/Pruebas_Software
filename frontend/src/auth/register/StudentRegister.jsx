import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const courses = [
  "Inicial I", "Inicial II", "Primero EGB", "Segundo EGB", "Tercero EGB",
  "Cuarto EGB", "Quinto EGB", "Sexto EGB", "Séptimo EGB", "Octavo EGB",
  "Noveno EGB", "Décimo EGB", "Primero BGU", "Segundo BGU", "Tercero BGU"
];

const StudentRegister = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    idCard: "",
    email: "",
    password: "",
    birthDate: "",
    course: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones simples
    if (Object.values(form).some((val) => val.trim() === "")) {
      setError("Por favor complete todos los campos.");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register/student`, form);
      alert("Estudiante registrado correctamente");
      navigate("/login/student");
    } catch (err) {
      setError("Error al registrar. Verifique los datos.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Registro de Estudiante</h2>

        {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="Nombre"
            value={form.firstName}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Apellido"
            value={form.lastName}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="idCard"
            placeholder="Cédula"
            value={form.idCard}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            className="col-span-2 border p-2 rounded"
          >
            <option value="">Seleccione un curso</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Registrar Estudiante
        </button>
      </form>
    </div>
  );
};

export default StudentRegister;
