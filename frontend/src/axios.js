// frontend/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // p.ej. "http://localhost:5000/api"
  withCredentials: true,
});

api.interceptors.response.use(
  response => response,
  error => {
    // Normaliza el error para tus componentes
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
