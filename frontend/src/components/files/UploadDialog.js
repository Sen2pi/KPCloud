import React, { useState, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Folder,
} from '@mui/icons-material';
import { useFiles } from '../../contexts/FileContext';

const UploadDialog = ({ open, onClose, onUploadComplete, currentFolder }) => {
  const { uploadFiles, uploading, uploadProgress } = useFiles();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadResult, setUploadResult] = useState(null);
  const [folderMode, setFolderMode] = useState(false);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    // Processar ficheiros mantendo estrutura de pastas
    const processedFiles = files.map(file => ({
      file,
      path: file.webkitRelativePath || file.name, // Manter caminho relativo
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setSelectedFiles(processedFiles);
    setUploadResult(null);
    
    // Resetar status
    const initialStatus = {};
    processedFiles.forEach(fileObj => {
      initialStatus[fileObj.path] = 'pending';
    });
    setUploadStatus(initialStatus);
  };

  // Drag & Drop handler para pastas
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    const allFiles = [];

    for (const item of items) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const files = await traverseFileTree(entry);
          allFiles.push(...files);
        }
      }
    }

    if (allFiles.length > 0) {
      processFiles(allFiles);
    }
  }, []);

  // Função recursiva para percorrer estrutura de pastas
  const traverseFileTree = async (item, path = '') => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          // Adicionar caminho completo ao ficheiro
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name,
            writable: false
          });
          resolve([file]);
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries) => {
          const files = [];
          for (const entry of entries) {
            const subFiles = await traverseFileTree(entry, path + item.name + '/');
            files.push(...subFiles);
          }
          resolve(files);
        });
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles(files => files.filter(fileObj => fileObj.path !== fileToRemove.path));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      // Marcar todos como uploading
      const uploadingStatus = {};
      selectedFiles.forEach(fileObj => {
        uploadingStatus[fileObj.path] = 'uploading';
      });
      setUploadStatus(uploadingStatus);

      console.log('Starting folder upload...', selectedFiles.length, 'files');
      
      // Enviar ficheiros com estrutura de pastas
      const result = await uploadFiles(selectedFiles, currentFolder, true); // true = manter estrutura
      
      console.log('Upload result:', result);
      setUploadResult(result);

      if (result && result.success) {
        // Marcar como sucesso
        const successStatus = {};
        selectedFiles.forEach(fileObj => {
          successStatus[fileObj.path] = 'success';
        });
        setUploadStatus(successStatus);
        
        setTimeout(() => {
          handleClose();
          if (onUploadComplete) {
            onUploadComplete();
          }
        }, 1500);
      } else {
        // Marcar como erro
        const errorStatus = {};
        selectedFiles.forEach(fileObj => {
          errorStatus[fileObj.path] = 'error';
        });
        setUploadStatus(errorStatus);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      
      const errorStatus = {};
      selectedFiles.forEach(fileObj => {
        errorStatus[fileObj.path] = 'error';
      });
      setUploadStatus(errorStatus);
      setUploadResult({ success: false, error: error.message });
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setUploadStatus({});
      setUploadResult(null);
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
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'uploading': return <CloudUpload color="primary" />;
      default: return <InsertDriveFile />;
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

  // Contar pastas únicas
  const uniqueFolders = new Set(
    selectedFiles
      .map(f => f.path.split('/').slice(0, -1).join('/'))
      .filter(path => path)
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload />
          Upload de Ficheiros e Pastas
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Toggle para modo de pasta */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={folderMode}
                onChange={(e) => setFolderMode(e.target.checked)}
              />
            }
            label="Modo de upload de pastas"
          />
        </Box>

        {selectedFiles.length === 0 ? (
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
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
              {folderMode ? 'Arrasta pastas ou clica para selecionar' : 'Seleciona ficheiros para upload'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {folderMode 
                ? 'Suporta pastas completas com estrutura preservada'
                : 'Clica aqui ou arrasta ficheiros para esta área'
              }
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              {folderMode ? 'Escolher Pastas' : 'Escolher Ficheiros'}
            </Button>
          </Box>
        ) : (
          <Box>
            {/* Estatísticas */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {totalFiles} ficheiro{totalFiles !== 1 ? 's' : ''} 
                {uniqueFolders.size > 0 && ` em ${uniqueFolders.size} pasta${uniqueFolders.size !== 1 ? 's' : ''}`}
                {uploading && ` • ${successFiles} concluído${successFiles !== 1 ? 's' : ''}`}
                {errorFiles > 0 && ` • ${errorFiles} com erro${errorFiles !== 1 ? 's' : ''}`}
              </Typography>
            </Box>

            {/* Lista de ficheiros com estrutura */}
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {selectedFiles.map((fileObj, index) => {
                const pathParts = fileObj.path.split('/');
                const isInFolder = pathParts.length > 1;
                
                return (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {isInFolder ? <Folder color="primary" /> : getStatusIcon(uploadStatus[fileObj.path])}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: isInFolder ? 'bold' : 'normal' }}>
                            {fileObj.path}
                          </Typography>
                          {isInFolder && (
                            <Typography variant="caption" color="text.secondary">
                              Pasta: {pathParts.slice(0, -1).join(' → ')}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatFileSize(fileObj.size)}
                          </Typography>
                          {uploadStatus[fileObj.path] === 'uploading' && (
                            <LinearProgress
                              variant="determinate"
                              value={uploadProgress || 0}
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {uploadStatus[fileObj.path] && (
                          <Chip
                            label={
                              uploadStatus[fileObj.path] === 'pending' ? 'Aguardando' :
                              uploadStatus[fileObj.path] === 'uploading' ? 'Enviando...' :
                              uploadStatus[fileObj.path] === 'success' ? 'Concluído' :
                              'Erro'
                            }
                            size="small"
                            color={getStatusColor(uploadStatus[fileObj.path])}
                            variant="outlined"
                          />
                        )}
                        
                        {!uploading && (
                          <IconButton
                            edge="end"
                            onClick={() => removeFile(fileObj)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>

            {/* Resultados do Upload */}
            {uploadResult && (
              <Box sx={{ mt: 2 }}>
                {uploadResult.success ? (
                  <Alert severity="success">
                    {uploadResult.successCount} ficheiro{uploadResult.successCount !== 1 ? 's' : ''} enviado{uploadResult.successCount !== 1 ? 's' : ''} com sucesso!
                    {uniqueFolders.size > 0 && ` Estrutura de ${uniqueFolders.size} pasta${uniqueFolders.size !== 1 ? 's' : ''} preservada.`}
                  </Alert>
                ) : (
                  <Alert severity="error">
                    Erro no upload: {uploadResult.error || 'Erro desconhecido'}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Input de ficheiro escondido */}
        <input
          id="file-input"
          type="file"
          multiple
          webkitdirectory={folderMode}
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
            {folderMode ? 'Escolher Pastas' : 'Escolher Ficheiros'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? null : <CloudUpload />}
          >
            {uploading 
              ? `Enviando... (${Math.round(uploadProgress || 0)}%)` 
              : `Enviar ${selectedFiles.length} ficheiro${selectedFiles.length !== 1 ? 's' : ''}${uniqueFolders.size > 0 ? ` (${uniqueFolders.size} pasta${uniqueFolders.size !== 1 ? 's' : ''})` : ''}`
            }
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
