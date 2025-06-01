import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  CameraAlt,
  Edit,
  Delete,
  PhotoCamera,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const ProfilePictureUpload = ({ 
  user, 
  onUpload, 
  uploading = false, 
  size = 120 
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [cropDialog, setCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de ficheiro
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleciona uma imagem válida');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter menos de 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setSelectedFile(file);
        setCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && onUpload) {
      console.log('Iniciando upload...', selectedFile);
      const result = await onUpload(selectedFile);
      console.log('Resultado do upload:', result);
      
      if (result.success) {
        setCropDialog(false);
        setPreviewImage(null);
        setSelectedFile(null);
        // Força refresh do componente
        window.location.reload(); // TEMPORÁRIO PARA TESTAR
      }
    }
  };

  const handleCancel = () => {
    setCropDialog(false);
    setPreviewImage(null);
    setSelectedFile(null);
  };

  // CONSTRUIR URL DA FOTO
// CONSTRUIR URL DA FOTO (CORRIGIDO)
const getProfilePictureUrl = () => {
  if (user?.profilePicture?.filename) {
    // REMOVER /api/ do URL para ficheiros estáticos
    const baseUrl = process.env.REACT_APP_API_URL || 'http://149.90.127.247:5000';
    const cleanBaseUrl = baseUrl.replace('/api', ''); // Remove /api se existir
    return `${cleanBaseUrl}/uploads/profiles/${user.profilePicture.filename}`;
  }
  return null;
};

  console.log('User no ProfilePictureUpload:', user);
  console.log('URL da foto:', getProfilePictureUrl());

  return (
    <>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Avatar
          src={getProfilePictureUrl()} // USAR FUNÇÃO PARA OBTER URL
          sx={{ 
            width: size, 
            height: size,
            bgcolor: 'primary.main',
            fontSize: size / 3,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              opacity: 0.8,
              transform: 'scale(1.02)',
            },
          }}
          onClick={() => document.getElementById('profile-picture-input').click()}
        >
          {user?.firstName?.charAt(0)}
        </Avatar>

        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
            }}
          >
            <CircularProgress size={30} sx={{ color: 'white' }} />
          </Box>
        )}

        <Tooltip title="Alterar foto de perfil">
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              bgcolor: 'primary.main',
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
            onClick={() => document.getElementById('profile-picture-input').click()}
          >
            <PhotoCamera sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <input
          id="profile-picture-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>

      {/* Dialog de Preview e Confirmação */}
      <Dialog open={cropDialog} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Foto de Perfil</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={uploading}
          >
            {uploading ? 'A carregar...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePictureUpload;
