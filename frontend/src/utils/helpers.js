import { MIME_TYPES, FILE_TYPES } from './constants';

export const getFileType = (mimetype) => {
  return MIME_TYPES[mimetype] || FILE_TYPES.OTHER;
};

export const getFileIcon = (mimetype) => {
  const type = getFileType(mimetype);
  
  const iconMap = {
    [FILE_TYPES.IMAGE]: 'image',
    [FILE_TYPES.VIDEO]: 'video_file',
    [FILE_TYPES.AUDIO]: 'audio_file',
    [FILE_TYPES.PDF]: 'picture_as_pdf',
    [FILE_TYPES.DOCUMENT]: 'description',
    [FILE_TYPES.ARCHIVE]: 'archive',
    [FILE_TYPES.OTHER]: 'insert_drive_file'
  };
  
  return iconMap[type] || iconMap[FILE_TYPES.OTHER];
};

export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para browsers mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export const isImageFile = (mimetype) => {
  return mimetype?.startsWith('image/');
};

export const isVideoFile = (mimetype) => {
  return mimetype?.startsWith('video/');
};

export const sortFiles = (files, sortBy, sortOrder) => {
  return [...files].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.originalName || a.name;
        bValue = b.originalName || b.name;
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case 'date':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'type':
        aValue = a.mimetype || '';
        bValue = b.mimetype || '';
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};
