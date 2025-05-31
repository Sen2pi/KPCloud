import React, { useState, useEffect } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit,
  Lock,
  Storage,
  Email,
  Person,
  Badge,
  Security,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { userAPI } from '../services/api';

import ProfilePictureUpload from '../components/profile/ProfilePictureUpload';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { loading, uploading, updateProfile, changePassword, uploadProfilePicture } = useProfile();
  
  const [editDialog, setEditDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      const response = await userAPI.getStorageStats();
      if (response.data.success) {
        setStorageStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleProfileUpdate = async () => {
    const result = await updateProfile(profileForm);
    if (result.success) {
      updateUser(result.user);
      setEditDialog(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As passwords não coincidem');
      return;
    }

    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (result.success) {
      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const handleProfilePictureUpload = async (file) => {
    return await uploadProfilePicture(file);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Typography variant="h4" gutterBottom>
        Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Coluna Esquerda - Informações Principais */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
            <ProfilePictureUpload
              user={user}
              onUpload={handleProfilePictureUpload}
              uploading={uploading}
              size={120}
            />
            
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            
            <Chip 
              label={user?.role} 
              color="primary" 
              variant="outlined" 
              sx={{ mt: 1 }}
            />
            
            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditDialog(true)}
                size="small"
              >
                Editar
              </Button>
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialog(true)}
                size="small"
              >
                Password
              </Button>
            </Box>
          </Paper>

          {/* Estatísticas de Armazenamento */}
          {storageStats && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Armazenamento
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {formatBytes(storageStats.storageUsed)} de {formatBytes(storageStats.storageQuota)}
                    </Typography>
                    <Typography variant="body2">
                      {storageStats.storagePercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={storageStats.storagePercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: storageStats.storagePercentage > 80 ? 'error.main' : 'primary.main',
                      },
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  📁 {storageStats.folderCount} pastas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📄 {storageStats.fileCount} ficheiros
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Coluna Direita - Detalhes da Conta */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações da Conta
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText
                  primary="Nome de Utilizador"
                  secondary={user?.username}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Badge />
                </ListItemIcon>
                <ListItemText
                  primary="Função"
                  secondary={user?.role}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Autenticação de Dois Fatores"
                  secondary={user?.twoFactorEnabled ? 'Ativada' : 'Desativada'}
                />
                <Chip 
                  label={user?.twoFactorEnabled ? 'Ativo' : 'Inativo'}
                  color={user?.twoFactorEnabled ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Atividade Recente */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Atividade Recente
            </Typography>
            
            <Alert severity="info">
              Último login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-PT') : 'Nunca'}
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Edição de Perfil */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Primeiro Nome"
              value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Último Nome"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Nome de Utilizador"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} startIcon={<Cancel />}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProfileUpdate} 
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Alteração de Password */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Password Atual"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Nova Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirmar Nova Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} startIcon={<Cancel />}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'A alterar...' : 'Alterar Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
