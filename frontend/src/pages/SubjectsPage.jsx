import React, { useEffect, useState, useContext } from 'react';
import { getSubjects, createSubject, deleteSubject } from '../services/api.js';
import { AuthContext } from '../auth/AuthContext.jsx';

export default function SubjectsPage() {
  const { user }     = useContext(AuthContext);
  const isAdmin      = user?.role === 'admin';

  const [list, setList]       = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const loadSubjects = () => {
    setError(null);
    setLoading(true);
    getSubjects()
      .then(res => setList(res.data))
      .catch(err => {
        if (err.response?.status === 403) setError('No autorizado para ver materias');
        else setError(err.response?.data?.message || err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadSubjects, []);

  const handleCreate = async () => {
    setError(null);
    if (!newName.trim()) return;
    try {
      await createSubject({ name: newName });
      setNewName('');
      loadSubjects();
    } catch (err) {
      if (err.response?.status === 403) setError('No autorizado para crear materias');
      else                                    setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta materia?')) return;
    setError(null);
    try {
      await deleteSubject(id);
      loadSubjects();
    } catch (err) {
      if (err.response?.status === 403) setError('No autorizado para eliminar materias');
      else                                    setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <p className="p-4">Cargando materias…</p>;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Materias</h1>

      {isAdmin && (
        <div className="mb-4 flex">
          <input
            type="text"
            placeholder="Nombre de la nueva materia"
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
      )}

      <ul className="list-disc pl-5">
        {list.map(s => (
          <li key={s._id} className="mb-2 flex justify-between">
            {s.name}
            {isAdmin && (
              <button
                onClick={() => handleDelete(s._id)}
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
