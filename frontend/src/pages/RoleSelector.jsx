import { useNavigate } from "react-router-dom";

const RoleSelector = () => {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    navigate(`/login/${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white text-center">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">
        Seleccione su tipo de usuario
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => handleSelect("student")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
        >
          👨‍🎓 Estudiante
        </button>
        <button
          onClick={() => handleSelect("teacher")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
        >
          👩‍🏫 Profesor
        </button>
        <button
          onClick={() => handleSelect("admin")}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
        >
          👨‍💼 Administrador
        </button>
        <button
          onClick={() => handleSelect("parent")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
        >
          👨‍👩‍👧 Padre de Familia
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;
