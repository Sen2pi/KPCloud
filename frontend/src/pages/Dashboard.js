import React, { useEffect, useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Upload,
  CreateNewFolder,
  InsertDriveFile,
  Folder,
} from '@mui/icons-material';
import { useFiles } from '../contexts/FileContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import FileGrid from '../components/files/FileGrid';
import UploadDialog from '../components/files/UploadDialog';

const Dashboard = () => {
  const { files, folders, loading, loadFiles, uploadFiles, createFolder } = useFiles();
  const [uploadDialog, setUploadDialog] = useState(false);
  const [folderDialog, setFolderDialog] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3498db');

  const folderColors = [
    { name: 'Azul', value: '#3498db' },
    { name: 'Verde', value: '#2ecc71' },
    { name: 'Roxo', value: '#9b59b6' },
    { name: 'Laranja', value: '#e67e22' },
    { name: 'Vermelho', value: '#e74c3c' },
    { name: 'Amarelo', value: '#f1c40f' },
  ];

  useEffect(() => {
    console.log('Dashboard mounted, carregando ficheiros...');
    loadFiles(null);
  }, []);

  const handleFolderClick = async (folderId) => {
    console.log('Navegando para pasta:', folderId);
    
    // Obter informações da pasta
    const folder = folders.find(f => f._id === folderId);
    if (folder) {
      console.log('Pasta encontrada:', folder);
      // Adicionar pasta ao caminho
      setCurrentPath([...currentPath, { id: folderId, name: folder.name }]);
    }
    
    setCurrentFolder(folderId);
    await loadFiles(folderId);
  };

  const handleNavigateToPath = (index) => {
    console.log('Navegando para índice:', index);
    
    if (index === -1) {
      // Voltar à raiz
      console.log('Voltando à raiz');
      setCurrentPath([]);
      setCurrentFolder(null);
      loadFiles(null);
    } else {
      // Navegar para nível específico
      const newPath = currentPath.slice(0, index + 1);
      const targetFolderId = newPath[newPath.length - 1].id;
      
      console.log('Navegando para caminho:', newPath);
      console.log('ID da pasta de destino:', targetFolderId);
      
      setCurrentPath(newPath);
      setCurrentFolder(targetFolderId);
      loadFiles(targetFolderId);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    console.log('=== CREATING FOLDER ===');
    console.log('Name:', newFolderName);
    console.log('Color:', newFolderColor);
    console.log('Parent:', currentFolder);

    const result = await createFolder(
      newFolderName.trim(),
      newFolderColor,
      currentFolder
    );

    if (result.success) {
      setFolderDialog(false);
      setNewFolderName('');
      setNewFolderColor('#3498db');
      loadFiles(currentFolder);
    }
  };

  const handleUploadComplete = () => {
    setUploadDialog(false);
    loadFiles(currentFolder);
  };

  // CORRIGIR: Definir quando mostrar EmptyState vs FileGrid
  const isRootAndEmpty = currentPath.length === 0 && files.length === 0 && folders.length === 0;
  const shouldShowFileGrid = !isRootAndEmpty || currentPath.length > 0; // SEMPRE mostrar FileGrid se não estamos na raiz

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Os Meus Ficheiros
        </Typography>
        
        {/* Botões de Ação */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialog(true)}
          >
            Upload
          </Button>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolder />}
            onClick={() => setFolderDialog(true)}
          >
            Nova Pasta
          </Button>
        </Box>
      </Box>

      {/* Conteúdo Principal - CORRIGIDO */}
      {loading ? (
        <LoadingSpinner message="A carregar ficheiros..." />
      ) : shouldShowFileGrid ? (
        // SEMPRE mostrar FileGrid quando não estamos na raiz OU quando há conteúdo
        <FileGrid
          files={files}
          folders={folders}
          onFolderClick={handleFolderClick}
          currentPath={currentPath}
          onNavigateToPath={handleNavigateToPath}
        />
      ) : (
        // Só mostrar EmptyState se estamos na raiz E está vazia
        <EmptyState
          icon={InsertDriveFile}
          title="Nenhum ficheiro"
          description="Ainda não tens ficheiros. Começa por fazer upload de alguns ficheiros ou criar novas pastas."
          showLogo={true}
        />
      )}

      {/* Dialog de Upload */}
      <UploadDialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        onUploadComplete={handleUploadComplete}
        currentFolder={currentFolder}
      />

      {/* Dialog de Nova Pasta */}
      <Dialog open={folderDialog} onClose={() => setFolderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Nova Pasta</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da pasta"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Cor da pasta</InputLabel>
            <Select
              value={newFolderColor}
              label="Cor da pasta"
              onChange={(e) => setNewFolderColor(e.target.value)}
            >
              {folderColors.map((color) => (
                <MenuItem key={color.value} value={color.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        bgcolor: color.value,
                        borderRadius: 1,
                      }}
                    />
                    {color.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateFolder} 
            variant="contained"
            disabled={!newFolderName.trim()}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
