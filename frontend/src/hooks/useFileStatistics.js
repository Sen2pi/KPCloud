import { useState, useEffect } from 'react';
import { useFiles } from '../contexts/FileContext';

export const useFileStatistics = () => {
  const { files } = useFiles();
  const [statistics, setStatistics] = useState({
    images: 0,
    documents: 0,
    programming: 0,
    compressed: 0,
    videos: 0,
    audio: 0,
    others: 0,
    total: 0
  });

  useEffect(() => {
    if (!files || files.length === 0) {
      setStatistics({
        images: 0,
        documents: 0,
        programming: 0,
        compressed: 0,
        videos: 0,
        audio: 0,
        others: 0,
        total: 0
      });
      return;
    }

    const stats = {
      images: 0,
      documents: 0,
      programming: 0,
      compressed: 0,
      videos: 0,
      audio: 0,
      others: 0,
      total: files.length
    };

    files.forEach(file => {
      const mimetype = file.mimetype?.toLowerCase() || '';
      const extension = file.originalName?.split('.').pop()?.toLowerCase() || '';

      if (isImageFile(mimetype, extension)) {
        stats.images++;
      } else if (isDocumentFile(mimetype, extension)) {
        stats.documents++;
      } else if (isProgrammingFile(mimetype, extension)) {
        stats.programming++;
      } else if (isCompressedFile(mimetype, extension)) {
        stats.compressed++;
      } else if (isVideoFile(mimetype, extension)) {
        stats.videos++;
      } else if (isAudioFile(mimetype, extension)) {
        stats.audio++;
      } else {
        stats.others++;
      }
    });

    setStatistics(stats);
  }, [files]);

  return statistics;
};

// Funções auxiliares de categorização
const isImageFile = (mimetype, extension) => {
  const imageTypes = ['image/', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageTypes.some(type => 
    mimetype.includes(type) || imageTypes.includes(extension)
  );
};

const isDocumentFile = (mimetype, extension) => {
  const documentTypes = ['application/pdf', 'application/msword', 'text/plain'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  
  return documentTypes.some(type => mimetype.includes(type)) ||
         documentExtensions.includes(extension);
};

const isProgrammingFile = (mimetype, extension) => {
  const programmingExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb',
    'html', 'css', 'json', 'xml', 'sql', 'sh'
  ];
  
  return programmingExtensions.includes(extension) ||
         mimetype.includes('javascript') || mimetype.includes('json');
};

const isCompressedFile = (mimetype, extension) => {
  const compressedTypes = ['application/zip', 'application/x-rar'];
  const compressedExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  return compressedTypes.some(type => mimetype.includes(type)) ||
         compressedExtensions.includes(extension);
};

const isVideoFile = (mimetype, extension) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  return mimetype.startsWith('video/') || videoExtensions.includes(extension);
};

const isAudioFile = (mimetype, extension) => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  return mimetype.startsWith('audio/') || audioExtensions.includes(extension);
};
