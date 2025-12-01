import React, { useState } from "react";
import axios from "axios";

const LoginPage = () => {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        { name, email, password, role }
      );
      if (response.status === 200) {
        alert("Login exitoso");
        setError("");
      }
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-[400px]">
        <h2 className="text-2xl font-bold text-center mb-4">Iniciar Sesión</h2>
        <div className="flex justify-center mb-4 gap-2">
          <button
            className={`px-4 py-2 rounded text-white ${role === "student" ? "bg-blue-700" : "bg-blue-500"}`}
            onClick={() => setRole("student")}
          >
            Ingresar como Estudiante
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${role === "teacher" ? "bg-green-700" : "bg-green-500"}`}
            onClick={() => setRole("teacher")}
          >
            Ingresar como Profesor
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${role === "admin" ? "bg-red-700" : "bg-red-500"}`}
            onClick={() => setRole("admin")}
          >
            Ingresar como Administrador
          </button>
        </div>
        {error && <p className="text-red-600 text-center">{error}</p>}
        <input
          type="text"
          placeholder="Nombre"
          className="border p-2 rounded w-full mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Correo"
          className="border p-2 rounded w-full mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="border p-2 rounded w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
};

export default LoginPage;