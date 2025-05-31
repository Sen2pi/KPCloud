export const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  PDF: 'pdf',
  ARCHIVE: 'archive',
  OTHER: 'other'
};

export const MIME_TYPES = {
  'image/jpeg': FILE_TYPES.IMAGE,
  'image/jpg': FILE_TYPES.IMAGE,
  'image/png': FILE_TYPES.IMAGE,
  'image/gif': FILE_TYPES.IMAGE,
  'image/webp': FILE_TYPES.IMAGE,
  'video/mp4': FILE_TYPES.VIDEO,
  'video/avi': FILE_TYPES.VIDEO,
  'video/mov': FILE_TYPES.VIDEO,
  'audio/mp3': FILE_TYPES.AUDIO,
  'audio/wav': FILE_TYPES.AUDIO,
  'audio/ogg': FILE_TYPES.AUDIO,
  'application/pdf': FILE_TYPES.PDF,
  'application/msword': FILE_TYPES.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FILE_TYPES.DOCUMENT,
  'text/plain': FILE_TYPES.DOCUMENT,
  'text/csv': FILE_TYPES.DOCUMENT,
  'application/zip': FILE_TYPES.ARCHIVE,
  'application/x-rar-compressed': FILE_TYPES.ARCHIVE
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const CHUNK_SIZE = 1024 * 1024; // 1MB

export const STORAGE_KEYS = {
  TOKEN: 'kpcloud_token',
  USER: 'kpcloud_user',
  THEME: 'kpcloud_theme',
  VIEW_MODE: 'kpcloud_view_mode'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile'
  },
  FILES: {
    UPLOAD: '/files/upload',
    LIST: '/files',
    DOWNLOAD: '/files/download',
    DELETE: '/files',
    SHARE: '/files/share'
  },
  FOLDERS: {
    CREATE: '/folders',
    LIST: '/folders',
    UPDATE: '/folders',
    DELETE: '/folders'
  }
};
