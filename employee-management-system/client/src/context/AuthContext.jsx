// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Create the Auth context
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // { id, name, role, token }
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  // Helper to store user
  const storeUser = (authData) => {
    const data = { ...authData, token: authData.token };
    localStorage.setItem('authUser', JSON.stringify(data));
    localStorage.setItem('token', authData.token);
    setUser(data);
  };

  // Login function – calls backend /api/auth/login
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      // Expected response: { token|accessToken, user: { id|_id, name, role } }
      const authData = {
        token: data.accessToken || data.token,
        id: data.user.id || data.user._id,
        name: data.user.name,
        role: data.user.role,
      };
      storeUser(authData);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout clears storage and redirects to login
  const logout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user?.token;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAdmin, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
