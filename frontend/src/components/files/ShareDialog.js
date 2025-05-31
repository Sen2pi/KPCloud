import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person,
  Delete,
  Email,
  Link,
  Security,
  Visibility,
  Edit,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useShare } from '../../hooks/useShare';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const ShareDialog = ({ open, onClose, item, itemType }) => {
  const {
    searchUsers,
    shareItem,
    updateSharePermission,
    removeShare,
    getItemShares,
    loading
  } = useShare();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState('read');
  const [currentShares, setCurrentShares] = useState([]);
  const [shareType, setShareType] = useState('private'); // private ou public

  useEffect(() => {
    if (open && item) {
      loadCurrentShares();
    }
  }, [open, item]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      handleSearchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadCurrentShares = async () => {
    const shares = await getItemShares(item._id, itemType);
    if (shares.success) {
      setCurrentShares(shares.shares);
    }
  };

  const handleSearchUsers = async () => {
    const result = await searchUsers(searchTerm);
    if (result.success) {
      setSearchResults(result.users);
    }
  };

  const handleAddShare = async () => {
    if (!selectedUser) return;

    const result = await shareItem(item._id, itemType, {
      userId: selectedUser._id,
      permission
    });

    if (result.success) {
      setSelectedUser(null);
      setSearchTerm('');
      setSearchResults([]);
      loadCurrentShares();
    }
  };

  const handleUpdatePermission = async (shareId, newPermission) => {
    const result = await updateSharePermission(shareId, newPermission);
    if (result.success) {
      loadCurrentShares();
    }
  };

  const handleRemoveShare = async (shareId) => {
    const result = await removeShare(shareId);
    if (result.success) {
      loadCurrentShares();
    }
  };

  const getPermissionIcon = (perm) => {
    switch (perm) {
      case 'read': return <Visibility />;
      case 'write': return <Edit />;
      case 'admin': return <AdminPanelSettings />;
      default: return <Visibility />;
    }
  };

  const getPermissionColor = (perm) => {
    switch (perm) {
      case 'read': return 'primary';
      case 'write': return 'warning';
      case 'admin': return 'error';
      default: return 'default';
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          Partilhar "{item?.originalName || item?.name}"
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Adicionar Novo Utilizador */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Adicionar Utilizador
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Autocomplete
              fullWidth
              options={searchResults}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (@${option.username})`}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar
                    src={getProfilePictureUrl(option.profilePicture)}
                    sx={{ mr: 2, width: 32, height: 32 }}
                  >
                    {option.firstName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{option.username} • {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              value={selectedUser}
              onChange={(event, newValue) => setSelectedUser(newValue)}
              inputValue={searchTerm}
              onInputChange={(event, newInputValue) => setSearchTerm(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pesquisar utilizadores..."
                  placeholder="Nome, username ou email"
                />
              )}
              loading={loading}
              noOptionsText="Nenhum utilizador encontrado"
            />

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Permissão</InputLabel>
              <Select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                label="Permissão"
              >
                <MenuItem value="read">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility /> Visualizar
                  </Box>
                </MenuItem>
                <MenuItem value="write">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Edit /> Editar
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings /> Admin
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAddShare}
              disabled={!selectedUser || loading}
            >
              Partilhar
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Visualizar:</strong> Pode ver e fazer download<br/>
              <strong>Editar:</strong> Pode ver, fazer download e modificar<br/>
              <strong>Admin:</strong> Pode gerir permissões e eliminar
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Utilizadores com Acesso */}
        <Typography variant="h6" gutterBottom>
          Utilizadores com Acesso ({currentShares.length})
        </Typography>

        {currentShares.length === 0 ? (
          <Alert severity="info">
            Este {itemType === 'file' ? 'ficheiro' : 'pasta'} ainda não está partilhado com ninguém.
          </Alert>
        ) : (
          <List>
            {currentShares.map((share) => (
              <ListItem key={share._id} divider>
                <ListItemAvatar>
                  <Avatar
                    src={getProfilePictureUrl(share.user.profilePicture)}
                    sx={{ width: 40, height: 40 }}
                  >
                    {share.user.firstName?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {share.user.firstName} {share.user.lastName}
                      </Typography>
                      <Chip
                        icon={getPermissionIcon(share.permissions)}
                        label={share.permissions === 'read' ? 'Visualizar' : 
                               share.permissions === 'write' ? 'Editar' : 'Admin'}
                        size="small"
                        color={getPermissionColor(share.permissions)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        @{share.user.username} • {share.user.email}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Partilhado em: {format(new Date(share.sharedAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                      </Typography>
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={share.permissions}
                        onChange={(e) => handleUpdatePermission(share._id, e.target.value)}
                        size="small"
                      >
                        <MenuItem value="read">Visualizar</MenuItem>
                        <MenuItem value="write">Editar</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>

                    <IconButton
                      onClick={() => handleRemoveShare(share._id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
