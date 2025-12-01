import React, { useState } from 'react';
import axios from 'axios';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', formData);
      alert(`Login successful! Role: ${res.data.role}`);
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
      <label>Name:</label>
      <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full border p-2 mb-2" />
      <label>Email:</label>
      <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border p-2 mb-2" />
      <label>Password:</label>
      <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full border p-2 mb-2" />
      <label>Role:</label>
      <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 mb-4">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Log In</button>
    </form>
  );
};

export default LoginForm;
