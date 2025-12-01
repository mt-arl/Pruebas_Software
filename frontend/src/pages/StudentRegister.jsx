import React, { useEffect, useState, useContext } from 'react';
import { getGrades } from '../services/api.js';
import { AuthContext } from '../auth/AuthContext.jsx';

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    getGrades().then(r => {
      // filtrar solo las de este estudiante
      setGrades(r.data.filter(g => g.studentEmail === user.email));
    });
  }, [user.email]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Panel Estudiante</h1>
      <button onClick={logout} className="mb-6 bg-red-500 text-white px-4 py-2 rounded">
        Cerrar sesión
      </button>
      <h2 className="text-xl font-semibold mb-4">Mis Calificaciones</h2>
      {grades.length === 0 ? (
        <p>No tienes calificaciones registradas.</p>
      ) : (
        <ul className="list-disc list-inside">
          {grades.map(g => (
            <li key={g._id}>{g.subjectName}: {g.score}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
