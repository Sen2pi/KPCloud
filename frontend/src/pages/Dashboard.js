import React, { useEffect, useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  ViewModule,
  ViewList,
  Add,
  CloudUpload,
  CreateNewFolder,
  NavigateNext,
} from '@mui/icons-material';
import { useFiles } from '../contexts/FileContext';
import FileGrid from '../components/files/FileGrid';
import FileUpload from '../components/files/FileUpload';

const Dashboard = () => {
  const {
    files,
    folders,
    currentFolder,
    loading,
    loadFiles,
    createFolder,
    viewMode,
    dispatch,
  } = useFiles();
  
  const [showUpload, setShowUpload] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    loadFiles(null);
  }, []);

  const handleFolderClick = (folderId) => {
    loadFiles(folderId);
    // Aqui poderias implementar a lógica para construir breadcrumbs
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (name) {
      await createFolder(name, currentFolder);
    }
  };

  const speedDialActions = [
    {
      icon: <CloudUpload />,
      name: 'Enviar Ficheiros',
      onClick: () => setShowUpload(true),
    },
    {
      icon: <CreateNewFolder />,
      name: 'Nova Pasta',
      onClick: handleCreateFolder,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Os Meus Ficheiros
          </Typography>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              color="inherit"
              href="#"
              onClick={() => loadFiles(null)}
              sx={{ cursor: 'pointer' }}
            >
              Raiz
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={crumb.id}
                color="inherit"
                href="#"
                onClick={() => loadFiles(crumb.id)}
                sx={{ cursor: 'pointer' }}
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        <Box>
          <Tooltip title={viewMode === 'grid' ? 'Vista de Lista' : 'Vista de Grelha'}>
            <IconButton
              onClick={() => dispatch({
                type: 'SET_VIEW_MODE',
                payload: viewMode === 'grid' ? 'list' : 'grid'
              })}
            >
              {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showUpload && (
        <FileUpload
          folderId={currentFolder}
          onClose={() => setShowUpload(false)}
        />
      )}

      {loading ? (
        <Typography>A carregar...</Typography>
      ) : (
        <FileGrid
          files={files}
          folders={folders}
          onFolderClick={handleFolderClick}
        />
      )}

      <SpeedDial
        ariaLabel="Ações rápidas"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default Dashboard;
