// frontend/src/components/StatCard.jsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ label, value }) {
  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
}
