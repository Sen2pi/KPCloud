import { useState } from 'react';
import { shareAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useShare = () => {
  const [loading, setLoading] = useState(false);

  const searchUsers = async (searchTerm) => {
    try {
      setLoading(true);
      const response = await shareAPI.searchUsers(searchTerm);
      
      if (response.data.success) {
        return { success: true, users: response.data.users };
      }
    } catch (error) {
      console.error('Erro ao pesquisar utilizadores:', error);
      toast.error('Erro ao pesquisar utilizadores');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const shareItem = async (itemId, itemType, shareData) => {
    try {
      setLoading(true);
      const response = itemType === 'file' 
        ? await shareAPI.shareFile(itemId, shareData)
        : await shareAPI.shareFolder(itemId, shareData);
      
      if (response.data.success) {
        toast.success('Item partilhado com sucesso!');
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao partilhar item:', error);
      toast.error(error.response?.data?.message || 'Erro ao partilhar item');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getItemShares = async (itemId, itemType) => {
    try {
      const response = itemType === 'file'
        ? await shareAPI.getFileShares(itemId)
        : await shareAPI.getFolderShares(itemId);
      
      if (response.data.success) {
        return { success: true, shares: response.data.shares };
      }
    } catch (error) {
      console.error('Erro ao obter partilhas:', error);
      return { success: false, shares: [] };
    }
  };

  const updateSharePermission = async (shareId, permission) => {
    try {
      const response = await shareAPI.updatePermission(shareId, { permission });
      
      if (response.data.success) {
        toast.success('Permissão atualizada!');
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
      return { success: false };
    }
  };

  const removeShare = async (shareId) => {
    try {
      const response = await shareAPI.removeShare(shareId);
      
      if (response.data.success) {
        toast.success('Partilha removida!');
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao remover partilha:', error);
      toast.error('Erro ao remover partilha');
      return { success: false };
    }
  };

const getSharedFolderContents = async (folderId) => {
  try {
    setLoading(true);
    console.log('Getting shared folder contents for:', folderId);
    
    const response = await shareAPI.getSharedFolderContents(folderId);
    
    if (response.data.success) {
      return { success: true, items: response.data.items };
    }
  } catch (error) {
    console.error('Erro ao obter conteúdo da pasta partilhada:', error);
    toast.error('Erro ao carregar conteúdo da pasta');
    return { success: false, items: [] };
  } finally {
    setLoading(false);
  }
};

const getSharedWithMe = async (params = {}) => {
  try {
    setLoading(true);
    console.log('Getting shared with me...');
    
    const response = await shareAPI.getSharedWithMe(params);
    
    if (response.data.success) {
      return { success: true, items: response.data.items };
    }
  } catch (error) {
    console.error('Erro ao obter ficheiros partilhados:', error);
    toast.error('Erro ao carregar ficheiros partilhados');
    return { success: false, items: [] };
  } finally {
    setLoading(false);
  }
};
  return {
    loading,
    getSharedWithMe,
    getSharedFolderContents,
    searchUsers,
    shareItem,
    getItemShares,
    updateSharePermission,
    removeShare,
  };
};
