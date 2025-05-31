import { MAX_FILE_SIZE } from './constants';
import { formatFileSize } from './formatters';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 6,
    errors: [
      ...(password.length < 6 ? ['Password deve ter pelo menos 6 caracteres'] : []),
      ...(!/[A-Z]/.test(password) ? ['Password deve conter pelo menos uma letra maiúscula'] : []),
      ...(!/[a-z]/.test(password) ? ['Password deve conter pelo menos uma letra minúscula'] : []),
      ...(!/\d/.test(password) ? ['Password deve conter pelo menos um número'] : [])
    ]
  };
};

export const validateFileName = (fileName) => {
  const invalidChars = /[<>:"/\\|?*]/;
  return {
    isValid: !invalidChars.test(fileName) && fileName.length > 0 && fileName.length <= 255,
    errors: [
      ...(fileName.length === 0 ? ['Nome do ficheiro não pode estar vazio'] : []),
      ...(fileName.length > 255 ? ['Nome do ficheiro muito longo'] : []),
      ...(invalidChars.test(fileName) ? ['Nome contém caracteres inválidos'] : [])
    ]
  };
};

export const validateFileType = (file, allowedTypes = []) => {
  if (allowedTypes.length === 0) return { isValid: true, errors: [] };
  
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
  
  return {
    isValid: isAllowed,
    errors: isAllowed ? [] : ['Tipo de ficheiro não permitido']
  };
};

export const validateFileSize = (file, maxSize = MAX_FILE_SIZE) => {
  return {
    isValid: file.size <= maxSize,
    errors: file.size > maxSize ? [`Ficheiro muito grande. Máximo: ${formatFileSize(maxSize)}`] : []
  };
};
