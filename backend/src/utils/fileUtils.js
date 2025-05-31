const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const hash = crypto.randomBytes(8).toString('hex');
  return `${name}-${hash}${ext}`;
};

const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('document') || mimetype.includes('text')) return 'document';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'archive';
  return 'other';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateThumbnail = async (inputPath, outputPath, width = 200, height = 200) => {
  try {
    await sharp(inputPath)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    return false;
  }
};

const isImageFile = (mimetype) => {
  return mimetype.startsWith('image/');
};

const isVideoFile = (mimetype) => {
  return mimetype.startsWith('video/');
};

module.exports = {
  generateUniqueFilename,
  getFileType,
  formatFileSize,
  generateThumbnail,
  isImageFile,
  isVideoFile
};
