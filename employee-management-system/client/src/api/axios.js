// src/api/axios.js
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Create an Axios instance with base URL from Vite env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
