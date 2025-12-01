import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('student');
  const [error, setError]       = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, role });
    } catch (err) {
      setError(err.response?.data?.message || 'Error de autenticación');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-2xl mb-4">Iniciar Sesión</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}

        <label className="block mb-2">
          Email:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block mb-2">
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block mb-4">
          Rol:
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-4"
        >
          Ingresar
        </button>

        <p className="text-center text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
}
