import React, { useState, useEffect } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
  Divider,
  Alert,
  Fab
} from '@mui/material';
import {
  Add,
  Search,
  Forum as ForumIcon,
  ThumbUp,
  Reply,
  Visibility,
  AccessTime,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../hooks/useForum';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Forum = () => {
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    stats,
    createPost, 
    getPosts, 
    toggleLikePost,
    getForumStats 
  } = useForum();
  
  const navigate = useNavigate();
  const [createDialog, setCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('lastActivity');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'geral',
    tags: ''
  });

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'geral', label: 'Geral' },
    { value: 'ajuda', label: 'Ajuda' },
    { value: 'discussao', label: 'Discussão' },
    { value: 'anuncios', label: 'Anúncios' },
    { value: 'sugestoes', label: 'Sugestões' }
  ];

  useEffect(() => {
    loadPosts();
    getForumStats();
  }, [selectedCategory, searchTerm, sortBy, currentPage]);

  const loadPosts = () => {
    getPosts({
      page: currentPage,
      limit: 10,
      category: selectedCategory,
      search: searchTerm,
      sortBy
    });
  };

  const handleCreatePost = async () => {
    const tags = newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const result = await createPost({
      ...newPost,
      tags
    });

    if (result.success) {
      setCreateDialog(false);
      setNewPost({ title: '', content: '', category: 'geral', tags: '' });
      loadPosts();
    }
  };

  const handleLike = async (postId) => {
    await toggleLikePost(postId);
    loadPosts(); // Recarregar para atualizar likes
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (profilePicture?.filename) {
      const baseUrl = 'http://149.90.127.247:5000';
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <ForumIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          KPCloud Fórum
        </Typography>
        
        {user && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
          >
            Novo Post
          </Button>
        )}
      </Box>

      {/* Estatísticas */}
      {stats && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            📝 {stats.totalPosts} posts • 💬 {stats.totalReplies} respostas
          </Typography>
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Pesquisar no fórum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Categoria"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Ordenar por"
              >
                <MenuItem value="lastActivity">Atividade Recente</MenuItem>
                <MenuItem value="createdAt">Mais Recente</MenuItem>
                <MenuItem value="views">Mais Visto</MenuItem>
                <MenuItem value="likes">Mais Curtido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Posts */}
      <Box sx={{ mb: 3 }}>
        {posts.map((post) => (
          <Card 
            key={post._id} 
            sx={{ 
              mb: 2, 
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: 3,
                transform: 'translateY(-1px)' 
              },
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate(`/forum/post/${post._id}`)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                  src={getProfilePictureUrl(post.author.profilePicture)}
                  sx={{ width: 48, height: 48 }}
                >
                  {post.author.firstName?.charAt(0)}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {post.isSticky && (
                      <Chip label="Fixo" size="small" color="warning" />
                    )}
                    <Chip 
                      label={categories.find(c => c.value === post.category)?.label}
                      size="small" 
                      color={getCategoryColor(post.category)}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {post.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2
                    }}
                  >
                    {post.content}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {post.author.firstName} {post.author.lastName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {format(new Date(post.lastActivity), 'dd/MM/yyyy HH:mm', { locale: pt })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {post.views}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ThumbUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {post.likesCount}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Reply sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {post.repliesCount}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Paginação */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil((stats?.totalPosts || 0) / 10)}
          page={currentPage}
          onChange={(e, page) => setCurrentPage(page)}
          color="primary"
        />
      </Box>

      {/* Dialog para Criar Post */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Post</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Título"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                label="Categoria"
              >
                {categories.slice(1).map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Conteúdo"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              margin="normal"
              multiline
              rows={6}
              required
            />
            
            <TextField
              fullWidth
              label="Tags (separadas por vírgula)"
              value={newPost.tags}
              onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              margin="normal"
              placeholder="react, javascript, ajuda"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreatePost} 
            variant="contained"
            disabled={!newPost.title || !newPost.content}
          >
            Publicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para dispositivos móveis */}
      {user && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' }
          }}
          onClick={() => setCreateDialog(true)}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default Forum;
