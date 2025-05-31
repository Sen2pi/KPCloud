import axios from 'axios';
import toast from 'react-hot-toast';

// Função para obter o URL base atual das configurações
const getBaseURL = () => {
  const settings = JSON.parse(localStorage.getItem('kpcloud_settings') || '{}');
  return settings.api?.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// Criar instância do axios sem baseURL fixo
let api = axios.create({
  timeout: 30000,
});

// Função para atualizar a instância do axios com novo baseURL
export const updateApiBaseURL = (newURL) => {
  api.defaults.baseURL = newURL;
  // console.log('API Base URL atualizado para:', newURL); // REMOVER OU COMENTAR
};

// Configurar baseURL inicial
updateApiBaseURL(getBaseURL());

// Interceptor para adicionar token e garantir baseURL correto
api.interceptors.request.use((config) => {
  // Sempre verificar se o baseURL está correto
  const currentBaseURL = getBaseURL();
  if (config.baseURL !== currentBaseURL) {
    config.baseURL = currentBaseURL;
  }
  
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

// REMOVER A LINHA "javascript" QUE ESTAVA AQUI

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  enable2FA: () => api.post('/users/2fa/enable'),
  verify2FA: (token) => api.post('/users/2fa/verify', { token }),
  disable2FA: (password) => api.post('/users/2fa/disable', { password }),
};

export const shareAPI = {
  searchUsers: (searchTerm) => api.get('/share/search-users', { params: { q: searchTerm } }),
  shareFile: (fileId, data) => api.post(`/share/files/${fileId}`, data),
  shareFolder: (folderId, data) => api.post(`/share/folders/${folderId}`, data),
  getFileShares: (fileId) => api.get(`/share/files/${fileId}`),
  getFolderShares: (folderId) => api.get(`/share/folders/${folderId}`),
  updatePermission: (shareId, data) => api.put(`/share/${shareId}/permission`, data),
  removeShare: (shareId) => api.delete(`/share/${shareId}`),
  getMyShares: (params) => api.get('/share/my-shares', { params }),
  getSharedWithMe: (params) => api.get('/share/shared-with-me', { params }),
};

export const fileAPI = {
  upload: (formData, onProgress) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  getFiles: (params) => api.get('/files', { params }),
  download: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  
  moveToTrash: (fileId) => api.post(`/trash/files/${fileId}`),
  restoreFromTrash: (fileId) => api.post(`/trash/files/${fileId}/restore`),
  deletePermanently: (fileId) => api.delete(`/trash/files/${fileId}/permanent`),
  
  share: (fileId, data) => api.post(`/files/${fileId}/share`, data),
  generatePublicLink: (fileId) => api.post(`/files/${fileId}/public-link`),
  getSharedFiles: (params) => api.get('/users/shared-files', { params }),
  
  getTrash: (params) => api.get('/trash', { params }),
  emptyTrash: () => api.delete('/trash/empty'),
};

// Verificar se esta secção existe no ficheiro
export const forumAPI = {
  getPosts: (params) => {
    console.log('ForumAPI getPosts params:', params);
    return api.get('/forum/posts', { params });
  },
  getPost: (postId) => {
    console.log('ForumAPI getPost postId:', postId);
    return api.get(`/forum/posts/${postId}`);
  },
  createPost: (data) => {
    console.log('ForumAPI createPost data:', data);
    return api.post('/forum/posts', data);
  },
  addReply: (postId, data) => {
    console.log('ForumAPI addReply:', { postId, data });
    return api.post(`/forum/posts/${postId}/replies`, data);
  },
  toggleLike: (postId) => {
    console.log('ForumAPI toggleLike postId:', postId);
    return api.post(`/forum/posts/${postId}/like`);
  },
  deletePost: (postId) => {
    console.log('ForumAPI deletePost postId:', postId);
    return api.delete(`/forum/posts/${postId}`);
  },
  getStats: () => {
    console.log('ForumAPI getStats');
    return api.get('/forum/stats');
  },
};


export const folderAPI = {
  create: (data) => api.post('/folders', data),
  getFolders: (params) => api.get('/folders', { params }),
  update: (folderId, data) => api.put(`/folders/${folderId}`, data),
  
  moveToTrash: (folderId) => api.post(`/trash/folders/${folderId}`),
  restoreFromTrash: (folderId) => api.post(`/trash/folders/${folderId}/restore`),
  deletePermanently: (folderId) => api.delete(`/trash/folders/${folderId}/permanent`),
  
  share: (folderId, data) => api.post(`/folders/${folderId}/share`, data),
};

export const userAPI = {
  getStorageStats: () => api.get('/users/storage-stats'),
};

export const systemAPI = {
  getDiskSpace: () => api.get('/system/disk-space'),
};

export default api;
