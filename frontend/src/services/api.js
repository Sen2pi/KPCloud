import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kpcloud_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kpcloud_token');
      localStorage.removeItem('kpcloud_user');
      window.location.href = '/login';
      toast.error('Sessão expirada. Por favor, faz login novamente.');
    } else if (error.response?.status >= 500) {
      toast.error('Erro interno do servidor. Tenta novamente mais tarde.');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  enable2FA: () => api.post('/users/2fa/enable'),
  verify2FA: (token) => api.post('/users/2fa/verify', { token }),
  disable2FA: (password) => api.post('/users/2fa/disable', { password }),
};


export const fileAPI = {
  upload: (formData, onProgress) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  getFiles: (params) => api.get('/files', { params }),
  download: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  
  // ENDPOINTS CORRETOS PARA O LIXO
  moveToTrash: (fileId) => api.post(`/trash/files/${fileId}`),
  restoreFromTrash: (fileId) => api.post(`/trash/files/${fileId}/restore`),
  deletePermanently: (fileId) => api.delete(`/trash/files/${fileId}/permanent`),
  
  share: (fileId, data) => api.post(`/files/${fileId}/share`, data),
  generatePublicLink: (fileId) => api.post(`/files/${fileId}/public-link`),
  getSharedFiles: (params) => api.get('/users/shared-files', { params }),
  
  // Endpoints para lixo
  getTrash: (params) => api.get('/trash', { params }),
  emptyTrash: () => api.delete('/trash/empty'),
};

export const folderAPI = {
  create: (data) => api.post('/folders', data),
  getFolders: (params) => api.get('/folders', { params }),
  update: (folderId, data) => api.put(`/folders/${folderId}`, data),
  
  // ENDPOINTS CORRETOS PARA O LIXO
  moveToTrash: (folderId) => api.post(`/trash/folders/${folderId}`),
  restoreFromTrash: (folderId) => api.post(`/trash/folders/${folderId}/restore`),
  deletePermanently: (folderId) => api.delete(`/trash/folders/${folderId}/permanent`),
  
  share: (folderId, data) => api.post(`/folders/${folderId}/share`, data),
};


export const userAPI = {
  getStorageStats: () => api.get('/users/storage-stats'),
};

export default api;
