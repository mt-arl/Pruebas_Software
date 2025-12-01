// frontend/src/pages/ClassesPage.jsx

import React, { useEffect, useState, useContext } from 'react';
import {
  getClasses,
  createClass,
  deleteClass,
  getUsers,
  getSubjects
} from '../services/api.js';
import { AuthContext } from '../auth/AuthContext.jsx';

export default function ClassesPage() {
  const { user } = useContext(AuthContext);
  const isAdmin  = user?.role === 'admin';

  const [classes, setClasses]       = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [newName, setNewName]       = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setError(null);
    setLoading(true);

    Promise.all([getClasses(), getUsers(), getSubjects()])
      .then(([clsRes, usersRes, subjRes]) => {
        setClasses(clsRes.data);

        // Profesores
        const profs = usersRes.data.filter(u => u.role === 'teacher');
        setTeachers(profs);
        if (profs.length > 0) setSelectedTeacher(profs[0]._id);

        // Materias (subName en lugar de name)
        console.log('>> Subjects from API:', subjRes.data);
        setSubjects(subjRes.data);
        if (subjRes.data.length > 0) setSelectedSubject(subjRes.data[0]._id);
      })
      .catch(err => {
        console.error('Error al cargar datos:', err.response || err);
        const msg = err.response?.data?.message || err.message;
        setError(`Error cargando datos (${err.response?.status || ''}): ${msg}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setError(null);
    setLoading(true);
    getClasses()
      .then(res => setClasses(res.data))
      .catch(err => {
        console.error('Error recargando clases:', err.response || err);
        const msg = err.response?.data?.message || err.message;
        setError(`Error recargando clases (${err.response?.status || ''}): ${msg}`);
      })
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    if (!newName.trim() || !selectedTeacher || !selectedSubject) return;
    setError(null);

    try {
      await createClass({
        sclassName: newName,
        teacher:    selectedTeacher,
        subject:    selectedSubject
      });
      setNewName('');
      reload();
    } catch (err) {
      console.error('DETALLE ERROR CREAR CLASE:', err.response);
      const status = err.response?.status;
      const msg    = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Error creando clase (${status}): ${msg}`);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta clase?')) return;
    setError(null);

    try {
      await deleteClass(id);
      reload();
    } catch (err) {
      console.error('Error eliminando clase:', err.response);
      const status = err.response?.status;
      const msg    = err.response?.data?.message || err.message;
      setError(`Error eliminando clase (${status}): ${msg}`);
    }
  };

  if (loading) return <p className="p-4">Cargando datos…</p>;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Clases</h1>

      {isAdmin && (
        <div className="mb-6 space-y-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Nombre de la nueva clase"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="border p-2 rounded flex-grow mr-2"
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Añadir
            </button>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block mb-1">Profesor asignado:</label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                className="border p-2 rounded w-full"
              >
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block mb-1">Materia asociada:</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="border p-2 rounded w-full"
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.subName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <ul className="list-disc pl-5">
        {classes.map(c => (
          <li key={c._id} className="mb-2 flex justify-between">
            <span>
              <strong>{c.sclassName}</strong> —{' '}
              <em className="text-gray-600">
                {subjects.find(s => s._id === c.subject)?.subName || '—'} |{' '}
                {teachers.find(t => t._id === c.teacher)?.name || '—'}
              </em>
            </span>
            {isAdmin && (
              <button
                onClick={() => handleDelete(c._id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
