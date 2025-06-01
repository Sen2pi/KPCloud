import React, { useEffect, useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  Share,
  Search,
  Person,
  AccessTime,
  Visibility,
  Edit,
  AdminPanelSettings,
  Download,
  ArrowBack,
  Home,
  NavigateNext,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useShare } from '../hooks/useShare';
import { useFiles } from '../contexts/FileContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const SharedFiles = () => {
  const { getSharedWithMe, getSharedFolderContents, loading } = useShare();
  const { downloadFile } = useFiles();
  
  const [currentPath, setCurrentPath] = useState([]); // [{name, id, permissions}, ...]
  const [currentItems, setCurrentItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPermission, setFilterPermission] = useState('all');

  useEffect(() => {
    if (currentPath.length === 0) {
      loadRootSharedItems();
    } else {
      loadFolderContents(currentPath[currentPath.length - 1].id);
    }
  }, [currentPath]);

  const loadRootSharedItems = async () => {
    console.log('Carregando itens partilhados da raiz...');
    const result = await getSharedWithMe();
    
    if (result.success) {
      setCurrentItems(result.items);
    }
  };

  const loadFolderContents = async (folderId) => {
    console.log('Carregando conteúdo da pasta:', folderId);
    const result = await getSharedFolderContents(folderId);
    
    if (result.success) {
      setCurrentItems(result.items);
    }
  };

  const navigateToFolder = (folder) => {
    console.log('Navegando para pasta:', folder);
    
    const newPathItem = {
      id: folder.item ? folder.item._id : folder._id,
      name: folder.item ? folder.item.name : folder.name,
      permissions: folder.permissions
    };
    
    setCurrentPath([...currentPath, newPathItem]);
  };

  const navigateToPath = (index) => {
    if (index === -1) {
      // Voltar à raiz
      setCurrentPath([]);
    } else {
      // Navegar para nível específico
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const goBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (profilePicture?.filename) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace('/api', '');
      return `${cleanBaseUrl}/uploads/profiles/${profilePicture.filename}`;
    }
    return null;
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'read': return <Visibility />;
      case 'write': return <Edit />;
      case 'admin': return <AdminPanelSettings />;
      default: return <Visibility />;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'read': return 'primary';
      case 'write': return 'warning';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'read': return 'Visualizar';
      case 'write': return 'Editar';
      case 'admin': return 'Admin';
      default: return 'Visualizar';
    }
  };

  const handleItemClick = (item) => {
    if (item.itemType === 'folder' || item.type === 'folder') {
      navigateToFolder(item);
    } else {
      downloadFile(item.item || item);
    }
  };

  const handleDownload = (item) => {
    if (item.itemType === 'file' || item.type === 'file') {
      downloadFile(item.item || item);
    }
  };

  // Filtrar itens
  const filteredItems = currentItems.filter(item => {
    const itemName = item.item ? (item.item.originalName || item.item.name) : (item.originalName || item.name);
    const itemType = item.itemType || item.type;
    const itemPermissions = item.permissions;

    const matchesSearch = !searchTerm || 
      itemName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || itemType === filterType;
    const matchesPermission = filterPermission === 'all' || itemPermissions === filterPermission;
    
    return matchesSearch && matchesType && matchesPermission;
  });

  if (loading) {
    return <LoadingSpinner message="A carregar..." />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Typography variant="h4" gutterBottom>
        <Share sx={{ mr: 1, verticalAlign: 'middle' }} />
        Partilhados Comigo
      </Typography>

      {/* Navegação e Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {currentPath.length > 0 && (
            <IconButton onClick={goBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          )}
          
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ flexGrow: 1 }}>
            <Link
              component="button"
              variant="body1"
              onClick={() => navigateToPath(-1)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none',
                color: currentPath.length === 0 ? 'primary.main' : 'text.primary',
                fontWeight: currentPath.length === 0 ? 'bold' : 'normal'
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 20 }} />
              Partilhados Comigo
            </Link>
            
            {currentPath.map((pathItem, index) => (
              <Link
                key={pathItem.id}
                component="button"
                variant="body1"
                onClick={() => navigateToPath(index)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: index === currentPath.length - 1 ? 'primary.main' : 'text.primary',
                  fontWeight: index === currentPath.length - 1 ? 'bold' : 'normal'
                }}
              >
                <FolderIcon sx={{ mr: 0.5, fontSize: 20 }} />
                {pathItem.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      </Box>

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Pesquisar..."
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
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Tipo"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="file">Ficheiros</MenuItem>
                <MenuItem value="folder">Pastas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Permissão</InputLabel>
              <Select
                value={filterPermission}
                onChange={(e) => setFilterPermission(e.target.value)}
                label="Permissão"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="read">Visualizar</MenuItem>
                <MenuItem value="write">Editar</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Lista de Ficheiros e Pastas */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={currentPath.length > 0 ? FolderIcon : Share}
          title={currentPath.length > 0 ? "Pasta vazia" : "Nenhum ficheiro partilhado"}
          description={
            currentPath.length > 0 
              ? "Esta pasta não contém ficheiros ou pastas."
              : filteredItems.length === 0 && currentItems.length > 0
                ? "Nenhum item corresponde aos filtros aplicados."
                : "Ainda não há ficheiros partilhados contigo."
          }
          showLogo={true}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredItems.map((item) => {
            const itemName = item.item ? (item.item.originalName || item.item.name) : (item.originalName || item.name);
            const itemType = item.itemType || item.type;
            const isFolder = itemType === 'folder';
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent>
                    {/* Ícone do ficheiro/pasta */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Avatar
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto',
                          bgcolor: isFolder ? 'primary.main' : 'secondary.main',
                          fontSize: '2rem'
                        }}
                      >
                        {isFolder ? '📁' : '📄'}
                      </Avatar>
                    </Box>

                    {/* Nome do ficheiro/pasta */}
                    <Typography
                      variant="subtitle2"
                      noWrap
                      title={itemName}
                      gutterBottom
                      sx={{ textAlign: 'center' }}
                    >
                      {itemName}
                    </Typography>

                    {/* Informações do proprietário (só na raiz) */}
                    {currentPath.length === 0 && item.owner && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar
                          src={getProfilePictureUrl(item.owner.profilePicture)}
                          sx={{ width: 24, height: 24 }}
                        >
                          {item.owner.firstName?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {item.owner.firstName} {item.owner.lastName}
                        </Typography>
                      </Box>
                    )}

                    {/* Permissão */}
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        icon={getPermissionIcon(item.permissions)}
                        label={getPermissionLabel(item.permissions)}
                        size="small"
                        color={getPermissionColor(item.permissions)}
                        variant="outlined"
                      />
                    </Box>

                    {/* Data */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {format(
                          new Date(item.sharedAt || item.createdAt || item.item?.createdAt), 
                          'dd/MM/yyyy HH:mm', 
                          { locale: pt }
                        )}
                      </Typography>
                    </Box>

                    {/* Botão de download para ficheiros */}
                    {!isFolder && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        sx={{ mt: 2 }}
                        size="small"
                      >
                        Download
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Informações adicionais */}
      {currentItems.length > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {currentPath.length === 0 
              ? `Tens ${currentItems.length} ${currentItems.length === 1 ? 'item partilhado' : 'itens partilhados'} contigo.`
              : `Esta pasta contém ${currentItems.length} ${currentItems.length === 1 ? 'item' : 'itens'}.`
            }
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SharedFiles;
