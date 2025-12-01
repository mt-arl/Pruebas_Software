
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-6">Seleccione su rol</h2>
      <div className="space-y-4">
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded"
          onClick={() => navigate('/login')}
        >
          Ingresar como Estudiante
        </button>
        <button
          className="bg-green-500 text-white px-6 py-2 rounded"
          onClick={() => navigate('/login')}
        >
          Ingresar como Profesor
        </button>
        <button
          className="bg-gray-700 text-white px-6 py-2 rounded"
          onClick={() => navigate('/login')}
        >
          Ingresar como Administrador
        </button>
        <button
          className="bg-yellow-500 text-white px-6 py-2 rounded"
          onClick={() => navigate('/student-dashboard')}
        >
          Ingresar como Invitado
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
