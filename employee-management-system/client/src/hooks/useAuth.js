// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/** @returns {any} */
export const useAuth = () => useContext(AuthContext);
