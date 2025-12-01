import React, { useEffect, useState } from 'react';
import { getGrades } from '../services/api';

export default function GradesList() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando calificaciones…</p>;
  if (error)   return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Calificaciones</h2>
      <ul className="list-disc pl-5">
        {grades.map(g => (
          <li key={g._id}>
            {g.studentName} – {g.subjectName}: <strong>{g.score}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
