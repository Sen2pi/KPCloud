import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useFiles } from '../../contexts/FileContext';

const UploadDialog = ({ open, onClose, onUploadComplete, currentFolder }) => {
  const { uploadFiles } = useFiles();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Resetar progresso e status
    const initialProgress = {};
    const initialStatus = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
      initialStatus[file.name] = 'pending';
    });
    setUploadProgress(initialProgress);
    setUploadStatus(initialStatus);
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles(files => files.filter(file => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      // Simular progresso individual para cada ficheiro
      for (const file of selectedFiles) {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        // Simular progresso
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Fazer upload real
      const result = await uploadFiles(selectedFiles, currentFolder);
      
      if (result.success) {
        // Marcar todos como sucesso
        const successStatus = {};
        selectedFiles.forEach(file => {
          successStatus[file.name] = 'success';
        });
        setUploadStatus(successStatus);
        
        // Aguardar um pouco para mostrar sucesso e fechar
        setTimeout(() => {
          handleClose();
          if (onUploadComplete) {
            onUploadComplete();
          }
        }, 1500);
      } else {
        // Marcar como erro
        const errorStatus = {};
        selectedFiles.forEach(file => {
          errorStatus[file.name] = 'error';
        });
        setUploadStatus(errorStatus);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorStatus = {};
      selectedFiles.forEach(file => {
        errorStatus[file.name] = 'error';
      });
      setUploadStatus(errorStatus);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setUploadProgress({});
      setUploadStatus({});
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <CloudUpload color="primary" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'primary';
      default: return 'default';
    }
  };

  const totalFiles = selectedFiles.length;
  const successFiles = Object.values(uploadStatus).filter(status => status === 'success').length;
  const errorFiles = Object.values(uploadStatus).filter(status => status === 'error').length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload />
          Upload de Ficheiros
        </Box>
      </DialogTitle>

      <DialogContent>
        {selectedFiles.length === 0 ? (
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Seleciona ficheiros para upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clica aqui ou arrasta ficheiros para esta área
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Escolher Ficheiros
            </Button>
          </Box>
        ) : (
          <Box>
            {/* Estatísticas */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {totalFiles} ficheiro{totalFiles !== 1 ? 's' : ''} selecionado{totalFiles !== 1 ? 's' : ''}
                {uploading && ` • ${successFiles} concluído${successFiles !== 1 ? 's' : ''}`}
                {errorFiles > 0 && ` • ${errorFiles} com erro${errorFiles !== 1 ? 's' : ''}`}
              </Typography>
            </Box>

            {/* Lista de ficheiros */}
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {selectedFiles.map((file, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {getStatusIcon(uploadStatus[file.name])}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatFileSize(file.size)}
                        </Typography>
                        {uploadStatus[file.name] === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress[file.name] || 0}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {uploadStatus[file.name] && (
                        <Chip
                          label={
                            uploadStatus[file.name] === 'pending' ? 'Aguardando' :
                            uploadStatus[file.name] === 'uploading' ? 'Enviando...' :
                            uploadStatus[file.name] === 'success' ? 'Concluído' :
                            'Erro'
                          }
                          size="small"
                          color={getStatusColor(uploadStatus[file.name])}
                          variant="outlined"
                        />
                      )}
                      
                      {!uploading && (
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(file)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {/* Alertas */}
            {errorFiles > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorFiles} ficheiro{errorFiles !== 1 ? 's' : ''} falharam no upload
              </Alert>
            )}
            
            {successFiles === totalFiles && totalFiles > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Todos os ficheiros foram enviados com sucesso!
              </Alert>
            )}
          </Box>
        )}

        {/* Input de ficheiro escondido */}
        <input
          id="file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {uploading ? 'A enviar...' : 'Cancelar'}
        </Button>
        
        {selectedFiles.length === 0 ? (
          <Button
            variant="contained"
            onClick={() => document.getElementById('file-input').click()}
          >
            Escolher Ficheiros
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? null : <CloudUpload />}
          >
            {uploading ? `Enviando... (${successFiles}/${totalFiles})` : `Enviar ${selectedFiles.length} ficheiro${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
