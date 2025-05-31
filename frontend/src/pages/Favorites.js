import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton, // ADICIONAR ESTA LINHA
} from '@mui/material';
import {
  Star,
  MoreVert,
  Download,
  Share,
  Delete,
  Search,
  Sort,
  FilterList,
  Clear,
} from '@mui/icons-material';
import { useFiles } from '../contexts/FileContext';
import { useFavorites } from '../hooks/useFavorites';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FavoriteButton from '../components/common/FavoriteButton';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Favorites = () => {
  const { downloadFile } = useFiles();
  const { favorites, clearFavorites } = useFavorites();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('addedToFavoritesAt');
  const [filterType, setFilterType] = useState('all');
  const [clearDialog, setClearDialog] = useState(false);

  const handleMenuOpen = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDownload = () => {
    if (selectedItem && selectedItem.type === 'file') {
      // Simular objeto de ficheiro para download
      const fileObj = {
        _id: selectedItem.id,
        originalName: selectedItem.name,
        mimetype: selectedItem.mimetype
      };
      downloadFile(fileObj);
    }
    handleMenuClose();
  };

  const getFileIcon = (mimetype, type) => {
    if (type === 'folder') return '📁';
    if (mimetype?.startsWith('image/')) return '🖼️';
    if (mimetype?.startsWith('video/')) return '🎥';
    if (mimetype?.startsWith('audio/')) return '🎵';
    if (mimetype === 'application/pdf') return '📄';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtrar e ordenar favoritos
  const filteredFavorites = favorites
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'addedToFavoritesAt':
          return new Date(b.addedToFavoritesAt) - new Date(a.addedToFavoritesAt);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'size':
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

  const handleClearFavorites = () => {
    clearFavorites();
    setClearDialog(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Favoritos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={<Star />} 
            label={`${favorites.length} itens`} 
            color="warning" 
            variant="outlined" 
          />
          {favorites.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={() => setClearDialog(true)}
            >
              Limpar Favoritos
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros e Pesquisa */}
      {favorites.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Pesquisar favoritos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <SelectMenuItem value="all">Todos</SelectMenuItem>
              <SelectMenuItem value="file">Ficheiros</SelectMenuItem>
              <SelectMenuItem value="folder">Pastas</SelectMenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              startAdornment={<Sort sx={{ mr: 1 }} />}
            >
              <SelectMenuItem value="addedToFavoritesAt">Adicionado recentemente</SelectMenuItem>
              <SelectMenuItem value="name">Nome</SelectMenuItem>
              <SelectMenuItem value="createdAt">Data de criação</SelectMenuItem>
              <SelectMenuItem value="size">Tamanho</SelectMenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Estatísticas */}
      {favorites.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Tens {filteredFavorites.length} de {favorites.length} favoritos a mostrar.
            {searchTerm && ` Pesquisa: "${searchTerm}"`}
            {filterType !== 'all' && ` | Filtro: ${filterType === 'file' ? 'Ficheiros' : 'Pastas'}`}
          </Typography>
        </Alert>
      )}

      {filteredFavorites.length === 0 ? (
        favorites.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhum favorito encontrado"
            description="Adiciona ficheiros e pastas aos favoritos clicando na estrela para acesso rápido."
            showLogo={true}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nenhum resultado encontrado"
            description="Tenta ajustar os filtros ou termo de pesquisa."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchTerm('');
              setFilterType('all');
            }}
          />
        )
      ) : (
        <Grid container spacing={2}>
          {filteredFavorites.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
                onClick={() => {
                  if (item.type === 'file') {
                    handleDownload();
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: item.type === 'folder' ? '#3498db' : 'grey.100',
                      fontSize: '3rem'
                    }}
                  >
                    {getFileIcon(item.mimetype, item.type)}
                  </Box>
                  
                  {/* Indicador de Favorito */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(255, 193, 7, 0.9)',
                      borderRadius: '50%',
                      p: 0.5,
                    }}
                  >
                    <Star sx={{ color: 'white', fontSize: 16 }} />
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                    }}
                  >
                    <FavoriteButton 
                      item={{ _id: item.id, originalName: item.name, ...item }} 
                      size="small" 
                      showTooltip={false}
                    />
                  </Box>

                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                    }}
                    onClick={(e) => handleMenuOpen(e, item)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <CardContent>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    title={item.name}
                    gutterBottom
                  >
                    {item.name}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" display="block">
                    Adicionado: {format(new Date(item.addedToFavoritesAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip 
                      label={item.type === 'file' ? 'Ficheiro' : 'Pasta'} 
                      size="small" 
                      color={item.type === 'file' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                    {item.size && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(item.size)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === 'file' && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 1 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} />
          Partilhar
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação para Limpar Favoritos */}
      <Dialog open={clearDialog} onClose={() => setClearDialog(false)} closeAfterTransition={false}>
        <DialogTitle>
          Limpar Favoritos
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres remover todos os {favorites.length} itens dos favoritos?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleClearFavorites}
            color="error"
            variant="contained"
          >
            Limpar Tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Favorites;
