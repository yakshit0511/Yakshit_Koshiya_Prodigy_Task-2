// src/api/axios.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Create an Axios instance with base URL from Vite env
const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: rawBaseUrl.replace(/\/api\/?$/, ''),
  timeout: 15000,
});

const showValidationErrors = (payload) => {
  const errors = payload?.errors || [];
  if (!Array.isArray(errors) || errors.length === 0) {
    toast.error(payload?.message || 'Validation failed');
    return;
  }

  const message = errors
    .map((item) => item?.message || item)
    .filter(Boolean)
    .join('\n');

  toast.error(message || payload?.message || 'Validation failed', {
    duration: 6000,
  });
};

const startRetryCountdown = (seconds) => {
  let remaining = seconds;
  const toastId = toast.error(`Too many requests. Retry in ${remaining}s`, {
    duration: Infinity,
  });

  const timer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(timer);
      toast.dismiss(toastId);
      toast.success('You can retry now');
      return;
    }
    toast.dismiss(toastId);
    toast.error(`Too many requests. Retry in ${remaining}s`, { duration: Infinity });
  }, 1000);
};

const redirectTo = (path) => {
  if (window.location.pathname !== path) {
    window.location.assign(path);
  }
};

// Request interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');

  if (!token) {
    try {
      const storedUser = localStorage.getItem('authUser');
      token = storedUser ? JSON.parse(storedUser)?.token : null;
    } catch {
      token = null;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data || {};

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out please retry');
      } else {
        toast.error('No internet connection');
      }
      return Promise.reject(error);
    }

    if (status === 400) {
      showValidationErrors(payload);
    } else if (status === 401) {
      localStorage.removeItem('authUser');
      localStorage.removeItem('token');
      toast.error(payload?.message || 'Session expired please login again');
      redirectTo('/login');
    } else if (status === 403) {
      toast.error('You do not have permission');
      redirectTo('/dashboard');
    } else if (status === 404) {
      toast.error('Resource not found');
    } else if (status === 422) {
      showValidationErrors(payload);
    } else if (status === 429) {
      const retryAfter = Number(error.response.headers['retry-after'] || 60);
      startRetryCountdown(Number.isFinite(retryAfter) ? retryAfter : 60);
    } else if (status >= 500) {
      toast.error('Server error please try again later');
    }

    return Promise.reject(error);
  }
);

export default api;
