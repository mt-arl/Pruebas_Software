// File: src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardShell from '../components/DashboardShell';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newGrade, setNewGrade] = useState({
    student: '',
    subject: '',
    score: '',
    sclass: ''
  });

  // Cargar las clases del profesor al inicio
  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        const response = await api.get('/class');
        setClasses(response.data);
      } catch (err) {
        setError('Error al cargar las clases');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  // Cargar estudiantes y notas cuando se selecciona una clase
  const handleSelectClass = async (classId) => {
    setLoading(true);
    try {
      const selected = classes.find(c => c._id === classId);
      setStudents(selected?.students || []);

      // notas de la clase
      const gradesResponse = await api.get('/grades');
      const classGrades = (gradesResponse.data || []).filter(
        grade => grade.sclass === classId
      );
      setGrades(classGrades);

      setSelectedClass(classId);
      setNewGrade(prev => ({ ...prev, sclass: classId, subject: selected?.subject?._id || '' }));
    } catch (err) {
      setError('Error al cargar estudiantes y notas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en el formulario de nueva nota
  const handleGradeChange = (e) => {
    const { name, value } = e.target;
    setNewGrade(prev => ({ ...prev, [name]: value }));
  };

  // Agregar nueva nota
  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!newGrade.student || !newGrade.score) {
      setError('Selecciona un estudiante y ingresa una nota');
      return;
    }
    try {
      const response = await api.post('/grades', newGrade);
      setGrades(prev => [...prev, response.data]);
      setNewGrade(prev => ({ ...prev, score: '', student: '' }));
      setError('');
    } catch (err) {
      setError('Error al agregar la nota');
      console.error(err);
    }
  };

  // Eliminar nota
  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta nota?')) return;
    try {
      await api.delete(`/grades/${gradeId}`);
      setGrades(prev => prev.filter(grade => grade._id !== gradeId));
    } catch (err) {
      setError('Error al eliminar la nota');
      console.error(err);
    }
  };

  return (
    <DashboardShell
      title="Teacher Dashboard"
      subtitle="Gestiona tus clases, estudiantes y calificaciones."
      logo="T"
    >
      {error && (
        <div className="ad-card" style={{ borderColor: '#fee2e2', background: '#fef2f2' }}>
          <div style={{ color: '#991b1b' }}>{error}</div>
        </div>
      )}

      <section className="ad-grid">
        {/* Mis clases */}
        <div className="ad-card">
          <h2 className="ad-h2">Mis Clases</h2>
          {loading ? (
            <p className="ad-empty">Cargando clases…</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {classes.map(cls => (
                <li key={cls._id}>
                  <button
                    onClick={() => handleSelectClass(cls._id)}
                    className="ad-btn"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: selectedClass === cls._id ? '#4f46e5' : '#e2e8f0',
                      color: selectedClass === cls._id ? '#fff' : '#0f172a'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700 }}>{cls.sclassName}</div>
                      <div style={{ fontSize: 12, color: selectedClass === cls._id ? 'rgba(255,255,255,.9)' : '#64748b' }}>
                        {cls?.subject?.subName || '—'}
                      </div>
                      <div style={{ fontSize: 12, opacity: .8 }}>
                        {(cls?.students?.length || 0)} estudiantes
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna derecha: Estudiantes + Calificaciones */}
        {selectedClass && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Estudiantes (form agregar nota) */}
            <div className="ad-card">
              <h2 className="ad-h2">Estudiantes</h2>
              {students.length === 0 ? (
                <p className="ad-empty">No hay estudiantes inscritos en esta clase.</p>
              ) : (
                <form onSubmit={handleAddGrade} className="ad-inline-form" style={{ marginTop: 8 }}>
                  <select
                    name="student"
                    value={newGrade.student}
                    onChange={handleGradeChange}
                    required
                    style={{ minWidth: 240 }}
                  >
                    <option value="">Seleccionar estudiante</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name || student.email}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    name="score"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newGrade.score}
                    onChange={handleGradeChange}
                    placeholder="Nota (0-10)"
                    required
                    style={{ minWidth: 160 }}
                  />

                  <button className="ad-btn" type="submit">Agregar Nota</button>
                </form>
              )}
            </div>

            {/* Calificaciones */}
            <div className="ad-card">
              <h2 className="ad-h2">Calificaciones</h2>
              {grades.length === 0 ? (
                <p className="ad-empty">No hay calificaciones registradas.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Nota</th>
                        <th style={{ width: 120 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map(grade => {
                        const student = students.find(s => s._id === grade.student);
                        return (
                          <tr key={grade._id}>
                            <td>{student?.name || student?.email || 'Desconocido'}</td>
                            <td>{grade.score}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteGrade(grade._id)}
                                className="ad-badge ad-badge--danger"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </DashboardShell>
  );
};

export default TeacherDashboard;
