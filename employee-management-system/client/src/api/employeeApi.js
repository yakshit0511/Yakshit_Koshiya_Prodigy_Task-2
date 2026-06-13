// src/api/employeeApi.js
import api from './axios';

// Get paginated/filtered employee list
export const getAllEmployees = (params) => api.get('/api/employees', { params });

// Get single employee by ID
export const getEmployeeById = (id) => api.get(`/api/employees/${id}`);

// Create employee (uses form-data for photo upload)
export const createEmployee = (formData) => api.post('/api/employees', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Update employee (uses form-data)
export const updateEmployee = (id, formData) => api.put(`/api/employees/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Soft delete employee
export const softDeleteEmployee = (id) => api.delete(`/api/employees/${id}`);

// Permanent delete employee
export const permanentDeleteEmployee = (id) => api.delete(`/api/employees/${id}/permanent`);

// Upload profile photo
export const uploadProfilePhoto = (id, file) => {
  const data = new FormData();
  data.append('photo', file);
  return api.post(`/api/employees/${id}/photo`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Get Dashboard overview stats
export const getDashboardStats = () => api.get('/api/employees/dashboard/stats');

// Get advanced stats
export const getAdvancedStats = () => api.get('/api/employees/stats/advanced');

// Advanced search
export const advancedSearch = (params) => api.get('/api/employees/search/advanced', { params });

// Bulk delete employees
export const bulkDeleteEmployees = (ids) => api.post('/api/employees/bulk-delete', { ids });

// Bulk status update
export const bulkStatusUpdate = (ids, status) => api.post('/api/employees/bulk-status-update', { ids, status });

// Export PDF / CSV
export const exportCsv = () => api.get('/api/employees/export/csv', { responseType: 'blob' });
export const exportPdf = () => api.get('/api/employees/export/pdf', { responseType: 'blob' });

// Salary history
export const getSalaryHistory = (id) => api.get(`/api/employees/${id}/salary-history`);
export const updateSalary = (id, newSalary, reason) => api.post(`/api/employees/${id}/salary`, { newSalary, reason });

// Document upload & delete
export const uploadDocument = (id, name, file) => {
  const data = new FormData();
  data.append('name', name);
  data.append('document', file);
  return api.post(`/api/employees/${id}/documents`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteDocument = (id, docId) => api.delete(`/api/employees/${id}/documents/${docId}`);

// Activity logs
export const getActivityLogs = (params) => api.get('/api/activity-logs', { params });
