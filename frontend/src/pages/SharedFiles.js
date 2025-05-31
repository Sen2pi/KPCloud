import React, { useEffect } from 'react';
import {
  Box,
  Toolbar,
  Typography,
} from '@mui/material';
import { Share } from '@mui/icons-material';
import { useFiles } from '../contexts/FileContext';
import FileGrid from '../components/files/FileGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const SharedFiles = () => {
  const { files, loading, loadFiles } = useFiles();

  useEffect(() => {
    // Aqui carregarias ficheiros partilhados
    // Por agora usa a mesma função
    loadFiles(null);
  }, []);

  if (loading) {
    return <LoadingSpinner message="A carregar ficheiros partilhados..." />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Typography variant="h4" gutterBottom>
        Partilhados Comigo
      </Typography>

      {files.length === 0 ? (
        <EmptyState
          icon={Share}
          title="Nenhum ficheiro partilhado"
          description="Quando alguém partilhar ficheiros contigo, aparecerão aqui."
        />
      ) : (
        <FileGrid
          files={files}
          folders={[]}
          onFolderClick={() => {}}
        />
      )}
    </Box>
  );
};

export default SharedFiles;
