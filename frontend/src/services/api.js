// File: src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  config => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// — Autenticación —

// POST /users/login
export async function login({ email, password, role }) {
  const { data } = await api.post('/users/login', { email, password, role });
  return data;
}

// POST /users/register
export async function registerUser({ name, email, password, role }) {
  const { data } = await api.post('/users/register', { name, email, password, role });
  return data;
}

// — Materias —

// GET /subjects
export async function getSubjects() {
  const { data } = await api.get('/subjects');
  return data;
}

// POST /subjects
export async function createSubject({ subName }) {
  const { data } = await api.post('/subjects', { subName });
  return data;
}

// POST /subjects/:id/students or /subject/:id/students
export async function enrollStudentInSubject({ subjectId, studentId }) {
  try {
    const { data } = await api.post(`/subjects/${subjectId}/students`, {
      student: studentId,
    });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      const { data } = await api.post(`/subject/${subjectId}/students`, {
        student: studentId,
      });
      return data;
    }
    throw err;
  }
}

// — Usuarios por rol —

// GET /users?role=teacher
export async function getTeachers() {
  const { data } = await api.get('/users', { params: { role: 'teacher' } });
  return data;
}

// GET /users?role=student
export async function getStudents() {
  const { data } = await api.get('/users', { params: { role: 'student' } });
  return data;
}

// — Clases —

// GET /class (todas las clases para admin)
export async function getClasses() {
  const { data } = await api.get('/class');
  return data;
}

// GET /class/my (clases del profesor logueado)
export async function getMyClasses() {
  const { data } = await api.get('/class/my');
  return data;
}

// POST /class
export async function createClass({ sclassName, subjectId, teacherId }) {
  const { data } = await api.post('/class', {
    sclassName,
    subject: subjectId,
    teacher: teacherId,
  });
  return data;
}

// DELETE /class/:id
export async function deleteClass(id) {
  const { data } = await api.delete(`/class/${id}`);
  return data;
}

// — Alumnos de una clase —

// GET /class/:id/students
export async function getClassStudents(classId) {
  const { data } = await api.get(`/class/${classId}/students`);
  return data;
}

// POST /class/:id/students (matricular en clase)
export async function addStudentToClass({ classId, studentId }) {
  const { data } = await api.post(`/class/${classId}/students`, {
    student: studentId,
  });
  return data;
}

// — Calificaciones —

// GET /grades
export async function getGrades() {
  const { data } = await api.get('/grades');
  return data;
}

// POST /grades
export async function createGrade({ studentId, classId, value }) {
  const { data } = await api.post('/grades', {
    student: studentId,
    sclass: classId,
    value,
  });
  return data;
}

// DELETE /grades/:id
export async function deleteGrade(id) {
  const { data } = await api.delete(`/grades/${id}`);
  return data;
}

// — Calificaciones del estudiante logueado —

// GET /grades/my
export async function getMyGrades() {
  const { data } = await api.get('/grades/my');
  return data;
}

// — Reportes —

// GET /report/student/:id
export async function generateReport(studentId) {
  const { data } = await api.get(`/report/student/${studentId}`, {
    responseType: 'blob',
  });
  return data;
}

export default api;
