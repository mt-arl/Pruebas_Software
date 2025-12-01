import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, registerUser } from '../services/api.js';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const signIn = async (email, password, role) => {
    const data = await login({ email, password, role });
    const userId = data.user?._id ?? data._id;
    setUser({ id: userId, token: data.token, role: data.role, name: data.name });
    return data;
  };

  const signUp = async (name, email, password, role) => {
    const data = await registerUser({ name, email, password, role });
    const userId = data.user?._id ?? data._id;
    setUser({ id: userId, token: data.token, role: data.role, name: data.name });
    return data;
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
