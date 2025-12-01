// frontend/src/components/GradesList.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';  // <-- apunta a src/axios.js
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress
} from '@mui/material';

export default function GradesList({ studentId }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    axios.get(`/grades/${studentId}`)    // Ajusta esta ruta a tu endpoint real
      .then(res => {
        setGrades(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!grades.length) {
    return <Typography>No hay calificaciones aún.</Typography>;
  }

  return (
    <Paper sx={{ padding: 2, marginTop: 2 }}>
      <Typography variant="h6" gutterBottom>Mis Calificaciones</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Asignatura</TableCell>
            <TableCell>Nota</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grades.map(g => (
            <TableRow key={g._id}>
              <TableCell>{g.subjectName}</TableCell>
              <TableCell>{g.mark}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
