import React, { useEffect, useState, useContext } from 'react';
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSubjects,
  getClasses
} from '../services/api.js';
import { AuthContext } from '../auth/AuthContext.jsx';

export default function GradesPage() {
  const { user } = useContext(AuthContext);
  const canEdit = ['admin', 'teacher'].includes(user?.role);

  const [grades, setGrades]       = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [classes, setClasses]     = useState([]);
  const [form, setForm]           = useState({ studentId: '', subjectId: '', score: '' });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getGrades(), getSubjects(), getClasses()])
      .then(([gRes, sRes, cRes]) => {
        setGrades(gRes.data);
        setSubjects(sRes.data);
        setClasses(cRes.data);
      })
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateGrade(editingId, form);
      } else {
        await createGrade(form);
      }
      setForm({ studentId: '', subjectId: '', score: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const startEdit = grade => {
    setEditingId(grade._id);
    setForm({ studentId: grade.studentId, subjectId: grade.subjectId, score: grade.score });
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta calificación?')) return;
    try {
      await deleteGrade(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <p className="p-4">Cargando calificaciones…</p>;
  if (error)   return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Calificaciones</h1>

      {canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <div>
            <label className="block">Estudiante (ID):</label>
            <input
              type="text"
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block">Clase:</label>
            <select
              value={form.classId}
              onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
              className="border p-2 rounded w-full"
            >
              <option value="">—Selecciona clase—</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block">Materia:</label>
            <select
              value={form.subjectId}
              onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">—Selecciona materia—</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block">Calificación:</label>
            <input
              type="number"
              value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              className="border p-2 rounded w-full"
              min="0"
              max="100"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {editingId ? 'Actualizar' : 'Agregar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ studentId: '', subjectId: '', score: '' });
              }}
              className="ml-2 text-gray-600 hover:underline"
            >
              Cancelar
            </button>
          )}
        </form>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Estudiante ID</th>
            <th className="border px-4 py-2">Clase</th>
            <th className="border px-4 py-2">Materia</th>
            <th className="border px-4 py-2">Nota</th>
            {canEdit && <th className="border px-4 py-2">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {grades.map(g => (
            <tr key={g._id}>
              <td className="border px-4 py-2">{g.studentId}</td>
              <td className="border px-4 py-2">
                {classes.find(c => c._id === g.classId)?.name || '—'}
              </td>
              <td className="border px-4 py-2">
                {subjects.find(s => s._id === g.subjectId)?.name || '—'}
              </td>
              <td className="border px-4 py-2">{g.score}</td>
              {canEdit && (
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => startEdit(g)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(g._id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
