import { useState } from 'react';
import { forumAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useForum = () => {
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const getPosts = async (params = {}) => {
    try {
      setLoading(true);
      console.log('Getting posts with params:', params);
      
      const response = await forumAPI.getPosts(params);
      
      if (response.data.success) {
        setPosts(response.data.posts);
        return { success: true, posts: response.data.posts };
      }
    } catch (error) {
      console.error('Erro ao obter posts:', error);
      toast.error('Erro ao carregar posts do fórum');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData) => {
    try {
      setLoading(true);
      
      console.log('=== CREATE POST FRONTEND DEBUG ===');
      console.log('Post data:', postData);
      
      // Limpar e validar dados
      const cleanPostData = {
        title: postData.title?.trim(),
        content: postData.content?.trim(),
        category: postData.category || 'geral',
        tags: Array.isArray(postData.tags) ? postData.tags : []
      };
      
      console.log('Clean post data:', cleanPostData);
      
      if (!cleanPostData.title) {
        toast.error('Título é obrigatório');
        return { success: false, error: 'Título é obrigatório' };
      }
      
      if (!cleanPostData.content) {
        toast.error('Conteúdo é obrigatório');
        return { success: false, error: 'Conteúdo é obrigatório' };
      }
      
      const response = await forumAPI.createPost(cleanPostData);
      console.log('Response from API:', response);
      
      if (response.data.success) {
        toast.success('Post criado com sucesso!');
        return { success: true, post: response.data.post };
      }
    } catch (error) {
      console.error('=== ERRO CREATE POST FRONTEND ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Erro ao criar post';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

   const getPost = async (postId) => {
  try {
    setLoading(true);
    console.log('Getting post:', postId);
    const response = await forumAPI.getPost(postId);
    
    if (response.data.success) {
      setCurrentPost(response.data.post);
      return { success: true, post: response.data.post };
    }
  } catch (error) {
    console.error('Erro ao obter post:', error);
    toast.error('Erro ao carregar post');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

  const toggleLikePost = async (postId) => {
    try {
      const response = await forumAPI.toggleLike(postId);
      
      if (response.data.success) {
        // Atualizar estado local se necessário
        return { success: true, ...response.data };
      }
    } catch (error) {
      console.error('Erro ao dar like:', error);
      toast.error('Erro ao processar like');
      return { success: false };
    }
  };

  const deletePost = async (postId) => {
    try {
      const response = await forumAPI.deletePost(postId);
      
      if (response.data.success) {
        toast.success('Post eliminado com sucesso!');
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao eliminar post:', error);
      toast.error(error.response?.data?.message || 'Erro ao eliminar post');
      return { success: false };
    }
  };

  const getForumStats = async () => {
    try {
      const response = await forumAPI.getStats();
      
      if (response.data.success) {
        setStats(response.data.stats);
        return { success: true, stats: response.data.stats };
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { success: false };
    }
  };



const addReply = async (postId, content) => {
  try {
    const response = await forumAPI.addReply(postId, { content });
    
    if (response.data.success) {
      setCurrentPost(response.data.post);
      toast.success('Resposta adicionada com sucesso!');
      return { success: true, post: response.data.post };
    }
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    toast.error(error.response?.data?.message || 'Erro ao adicionar resposta');
    return { success: false };
  }
};


  return {
    posts,
    currentPost,
    loading,
    stats,
    getPosts,
    getPost,
    createPost,
    addReply,
    toggleLikePost,
    deletePost,
    getForumStats
  };
};
