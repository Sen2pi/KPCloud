import axios from "axios";
import toast from "react-hot-toast";

// Função para obter o URL base atual das configurações
const getBaseURL = () => {
  const settings = JSON.parse(localStorage.getItem("kpcloud_settings") || "{}");
  return (
    settings.api?.baseURL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api"
  );
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

  const token = localStorage.getItem("kpcloud_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
const retryRequest = async (config, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await api(config);
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        console.log(`Requisição limitada, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Não mostrar toast para 429 se vamos retry
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
      
      console.log('Rate limit atingido, aguardando...');
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry da requisição original
      try {
        return await retryRequest(error.config, 2, 1000);
      } catch (retryError) {
        toast.error("Servidor sobrecarregado. Tenta novamente mais tarde.");
      }
    } else if (error.response?.status === 401) {
      localStorage.removeItem("kpcloud_token");
      localStorage.removeItem("kpcloud_user");
      window.location.href = "/login";
      toast.error("Sessão expirada. Por favor, faz login novamente.");
    } else if (error.response?.status >= 500) {
      toast.error("Erro interno do servidor. Tenta novamente mais tarde.");
    }

    return Promise.reject(error);
  }
);
// REMOVER A LINHA "javascript" QUE ESTAVA AQUI

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/password", data),
  uploadProfilePicture: (formData) =>
    api.post("/users/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  enable2FA: () => api.post("/users/2fa/enable"),
  verify2FA: (token) => api.post("/users/2fa/verify", { token }),
  disable2FA: (password) => api.post("/users/2fa/disable", { password }),
};

export const shareAPI = {
  searchUsers: (searchTerm) =>
    api.get("/share/search-users", { params: { q: searchTerm } }),
  shareFile: (fileId, data) => api.post(`/share/files/${fileId}`, data),
  shareFolder: (folderId, data) => api.post(`/share/folders/${folderId}`, data),
  getFileShares: (fileId) => api.get(`/share/files/${fileId}`),
  getFolderShares: (folderId) => api.get(`/share/folders/${folderId}`),
  updatePermission: (shareId, data) =>
    api.put(`/share/${shareId}/permission`, data),
  removeShare: (shareId) => api.delete(`/share/${shareId}`),
  getMyShares: (params) => api.get("/share/my-shares", { params }),
  getSharedWithMe: (params) => api.get("/share/shared-with-me", { params }),
  getSharedFolderContents: (folderId) =>
    api.get(`/share/folder-contents/${folderId}`), // NOVA FUNÇÃO
};

export const fileAPI = {
  upload: (formData, onProgress) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  getFiles: (params) => api.get('/files', { params }),
  download: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  moveFile: (fileId, folderId) => api.put(`/files/${fileId}/move`, { folderId }), // ADICIONAR ESTA FUNÇÃO
  moveToTrash: (fileId) => api.post(`/trash/files/${fileId}`),
  restoreFromTrash: (fileId) => api.post(`/trash/files/${fileId}/restore`),
  deletePermanently: (fileId) => api.delete(`/trash/files/${fileId}/permanent`),
  share: (fileId, data) => api.post(`/files/${fileId}/share`, data),
  getTrash: () => api.get('/trash'),
  emptyTrash: () => api.delete('/trash/empty'),
};

export const folderAPI = {
  create: (data) => api.post('/folders', data),
  getFolders: (params) => api.get('/folders', { params }), // CORRIGIR: usar 'params' diretamente
  update: (folderId, data) => api.put(`/folders/${folderId}`, data),
  moveToFolder: (folderId, targetFolderId) => api.put(`/folders/${folderId}/move`, { targetFolderId }),
  moveToTrash: (folderId) => api.post(`/trash/folders/${folderId}`),
  restoreFromTrash: (folderId) => api.post(`/trash/folders/${folderId}/restore`),
  deletePermanently: (folderId) => api.delete(`/trash/folders/${folderId}/permanent`),
  share: (folderId, data) => api.post(`/folders/${folderId}/share`, data),
};


// Verificar se esta secção existe no ficheiro
export const forumAPI = {
  getPosts: (params) => {
    console.log("ForumAPI getPosts params:", params);
    return api.get("/forum/posts", { params });
  },
  getPost: (postId) => {
    console.log("ForumAPI getPost postId:", postId);
    return api.get(`/forum/posts/${postId}`);
  },
  createPost: (data) => {
    console.log("ForumAPI createPost data:", data);
    return api.post("/forum/posts", data);
  },
  addReply: (postId, data) => {
    console.log("ForumAPI addReply:", { postId, data });
    return api.post(`/forum/posts/${postId}/replies`, data);
  },
  toggleLike: (postId) => {
    console.log("ForumAPI toggleLike postId:", postId);
    return api.post(`/forum/posts/${postId}/like`);
  },
  deletePost: (postId) => {
    console.log("ForumAPI deletePost postId:", postId);
    return api.delete(`/forum/posts/${postId}`);
  },
  getStats: () => {
    console.log("ForumAPI getStats");
    return api.get("/forum/stats");
  },
};


export const userAPI = {
  getStorageStats: () => api.get("/users/storage-stats"),
};

export const systemAPI = {
  getDiskSpace: () => api.get("/system/disk-space"),
};

export default api;
