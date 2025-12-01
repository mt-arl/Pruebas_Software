// frontend/src/pages/DashboardPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../redux/dashboard/dashboardSlice';
import { CircularProgress, Grid, Typography, Button } from '@mui/material';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector(state => state.dashboard);
  const { currentRole } = useSelector(state => state.user);

  useEffect(() => {
    // Sólo hacemos fetch una vez
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        {currentRole === 'Admin'
          ? 'Dashboard de Administrador'
          : currentRole === 'Student'
          ? 'Mi Panel de Estudiante'
          : currentRole === 'Teacher'
          ? 'Panel de Profesor'
          : 'Vista de Invitado'}
      </Typography>

      {/* Sólo Admin y Guest verán estas métricas globales */}
      {(currentRole === 'Admin' || currentRole === 'Guest') && stats && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Alumnos" value={stats.students} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Profesores" value={stats.teachers} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Clases" value={stats.classes} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Asignaturas" value={stats.subjects} />
          </Grid>
        </Grid>
      )}

      {/* Los estudiantes ven sus calificaciones */}
      {currentRole === 'Student' && (
        <>
          <Button variant="contained" href="/calificaciones" sx={{ mt: 2 }}>
            Ver mis Calificaciones
          </Button>
        </>
      )}

      {/* Los profesores podrían ver aquí sus cursos */}
      {currentRole === 'Teacher' && (
        <Typography sx={{ mt: 2 }}>Aquí iría un listado de tus clases</Typography>
      )}
    </div>
  );
}
