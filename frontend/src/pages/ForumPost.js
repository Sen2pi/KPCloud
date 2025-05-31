import React, { useState, useEffect } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Divider,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  ThumbUp,
  Reply,
  ArrowBack,
  Person,
  AccessTime,
  Visibility,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../hooks/useForum';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ForumPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPost, loading, getPost, addReply, toggleLikePost } = useForum();
  
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (postId) {
      console.log('Loading post with ID:', postId);
      getPost(postId);
    }
  }, [postId]);

  const handleAddReply = async (e) => {
    e.preventDefault();
    
    if (!newReply.trim()) {
      toast.error('Por favor escreve uma resposta');
      return;
    }

    setSubmittingReply(true);
    const result = await addReply(postId, newReply.trim());
    
    if (result.success) {
      setNewReply('');
    }
    
    setSubmittingReply(false);
  };

  const handleLike = async () => {
    await toggleLikePost(postId);
    // Recarregar post para atualizar likes
    getPost(postId);
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (profilePicture?.filename) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace('/api', '');
      return `${cleanBaseUrl}/uploads/profiles/${profilePicture.filename}`;
    }
    return null;
  };

  const getCategoryColor = (category) => {
    const colors = {
      geral: 'default',
      ajuda: 'error',
      discussao: 'primary',
      anuncios: 'warning',
      sugestoes: 'success'
    };
    return colors[category] || 'default';
  };

  if (loading) {
    return <LoadingSpinner message="A carregar post..." />;
  }

  if (!currentPost) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Alert severity="error">
          Post não encontrado ou ocorreu um erro ao carregar.
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/forum')}
          sx={{ mt: 2 }}
        >
          Voltar ao Fórum
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/forum')}
          sx={{ mr: 2 }}
        >
          Voltar ao Fórum
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {currentPost.title}
        </Typography>
      </Box>

      {/* Post Principal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            src={getProfilePictureUrl(currentPost.author.profilePicture)}
            sx={{ width: 56, height: 56 }}
          >
            {currentPost.author.firstName?.charAt(0)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {currentPost.author.firstName} {currentPost.author.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{currentPost.author.username}
              </Typography>
              {currentPost.isSticky && (
                <Chip label="Fixo" size="small" color="warning" />
              )}
              <Chip 
                label={currentPost.category}
                size="small" 
                color={getCategoryColor(currentPost.category)}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {format(new Date(currentPost.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Visibility sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {currentPost.views} visualizações
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
          {currentPost.content}
        </Typography>
        
        {/* Tags */}
        {currentPost.tags && currentPost.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {currentPost.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                variant="outlined" 
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
        
        {/* Ações */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {user && (
            <Button
              startIcon={<ThumbUp />}
              variant={currentPost.isLikedByUser ? "contained" : "outlined"}
              onClick={handleLike}
              size="small"
            >
              {currentPost.likesCount} {currentPost.likesCount === 1 ? 'Like' : 'Likes'}
            </Button>
          )}
          
          <Typography variant="body2" color="text.secondary">
            {currentPost.repliesCount} {currentPost.repliesCount === 1 ? 'resposta' : 'respostas'}
          </Typography>
        </Box>
      </Paper>

      {/* Formulário de Resposta */}
      {user && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Reply sx={{ mr: 1, verticalAlign: 'middle' }} />
            Adicionar Resposta
          </Typography>
          
          <Box component="form" onSubmit={handleAddReply}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Escreve a tua resposta..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submittingReply || !newReply.trim()}
            >
              {submittingReply ? 'A enviar...' : 'Responder'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista de Respostas */}
      <Typography variant="h6" gutterBottom>
        Respostas ({currentPost.repliesCount})
      </Typography>
      
      {currentPost.replies && currentPost.replies.length > 0 ? (
        currentPost.replies
          .filter(reply => !reply.isDeleted)
          .map((reply, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    src={getProfilePictureUrl(reply.author.profilePicture)}
                    sx={{ width: 40, height: 40 }}
                  >
                    {reply.author.firstName?.charAt(0)}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {reply.author.firstName} {reply.author.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{reply.author.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {format(new Date(reply.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {reply.content}
                    </Typography>
                    
                    {reply.likes && reply.likes.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          👍 {reply.likes.length}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
      ) : (
        <Alert severity="info">
          Ainda não há respostas neste post. Sê o primeiro a responder!
        </Alert>
      )}
    </Box>
  );
};

export default ForumPost;
