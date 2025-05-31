import { useState, useRef } from 'react';
import { authAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // ADICIONAR
import toast from 'react-hot-toast';

export const useProfile = () => {
  const { updateUser } = useAuth(); // ADICIONAR
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(profileData);
      
      if (response.data.success) {
        // ATUALIZAR O CONTEXTO
        updateUser(response.data.user);
        toast.success('Perfil atualizado com sucesso!');
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwords) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword(passwords);
      
      if (response.data.success) {
        toast.success('Password alterada com sucesso!');
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao alterar password');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('Enviando foto de perfil...');
      const response = await authAPI.uploadProfilePicture(formData);
      
      if (response.data.success) {
        console.log('Resposta do upload:', response.data);
        
        // ATUALIZAR O UTILIZADOR NO CONTEXTO
        updateUser(response.data.user);
        
        toast.success('Foto de perfil atualizada!');
        return { 
          success: true, 
          imageUrl: response.data.profilePictureUrl,
          user: response.data.user 
        };
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da foto');
      return { success: false };
    } finally {
      setUploading(false);
    }
  };

  return {
    loading,
    uploading,
    fileInputRef,
    updateProfile,
    changePassword,
    uploadProfilePicture,
  };
};
