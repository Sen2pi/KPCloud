import { useState, useCallback } from 'react';
import { fileAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFiles = useCallback(async (files, folderId = null) => {
    setUploading(true);
    setUploadProgress(0);
    const results = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) formData.append('folderId', folderId);

        const response = await fileAPI.upload(formData, (progressEvent) => {
          const fileProgress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          const totalProgress = Math.round(
            ((i * 100) + fileProgress) / files.length
          );
          setUploadProgress(totalProgress);
        });

        results.push(response.data);
      }

      setUploadedFiles(results);
      toast.success(`${files.length} ficheiro(s) enviado(s) com sucesso!`);
      return { success: true, files: results };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao enviar ficheiros';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploadedFiles([]);
    setUploadProgress(0);
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadedFiles,
    uploadFiles,
    resetUpload
  };
};
