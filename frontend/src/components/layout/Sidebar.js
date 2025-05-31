import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  InsertDriveFile,
  Share,
  Star,
  Group,
  Delete,
  Storage,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStorageInfo } from '../../hooks/useStorageInfo';
import { useFavorites } from '../../hooks/useFavorites';
import { useFileStatistics } from '../../hooks/useFileStatistics';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const storageInfo = useStorageInfo();
  const { favorites } = useFavorites();
  const fileStatistics = useFileStatistics();

  const menuItems = [
    { text: 'Os Meus Ficheiros', icon: <InsertDriveFile />, path: '/dashboard' },
    { text: 'Fórum', icon: <Group />, path: '/forum' },
    { text: 'Partilhados Comigo', icon: <Share />, path: '/shared' },
    {
      text: 'Favoritos',
      icon: <Star />,
      path: '/favorites',
      badge: favorites.length > 0 ? favorites.length : null
    },
    { text: 'Lixo', icon: <Delete />, path: '/trash' },
  ];

  // CORRIGIR: Garantir que percentage é sempre um número válido
  const safePercentage = typeof storageInfo.percentage === 'number' && !isNaN(storageInfo.percentage) 
    ? Math.min(Math.max(storageInfo.percentage, 0), 100) 
    : 0;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Menu Items */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="primary">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Estatísticas de Tipos de Ficheiro */}
        {fileStatistics.total > 0 && (
          <>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Tipos de Ficheiro
              </Typography>
              
              {/* Mostrar estatísticas simples */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {fileStatistics.images > 0 && (
                  <Typography variant="caption">
                    🖼️ Imagens: {fileStatistics.images}
                  </Typography>
                )}
                {fileStatistics.documents > 0 && (
                  <Typography variant="caption">
                    📄 Documentos: {fileStatistics.documents}
                  </Typography>
                )}
                {fileStatistics.programming > 0 && (
                  <Typography variant="caption">
                    💻 Programação: {fileStatistics.programming}
                  </Typography>
                )}
                {fileStatistics.compressed > 0 && (
                  <Typography variant="caption">
                    📦 Compactados: {fileStatistics.compressed}
                  </Typography>
                )}
              </Box>
            </Box>
            <Divider />
          </>
        )}

        {/* Informação de Armazenamento */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Storage />
            <Typography variant="subtitle2">
              Armazenamento
            </Typography>
          </Box>
          
          {/* CORRIGIR: Sempre garantir que value é um número válido */}
          <LinearProgress
            variant="determinate"
            value={safePercentage}
            sx={{
              mb: 1,
              '& .MuiLinearProgress-bar': {
                bgcolor: safePercentage > 80 ? 'error.main' : 'primary.main',
              },
            }}
          />
          
          <Typography variant="caption" color="text.secondary">
            {storageInfo.formattedUsage || '0 MB'} de {storageInfo.formattedQuota || '1 GB'} utilizados
          </Typography>
          
          <Typography variant="caption" color="text.secondary" display="block">
            {safePercentage.toFixed(1)}% utilizado
          </Typography>
          
          {!storageInfo.supported && (
            <Typography variant="caption" color="text.secondary" display="block">
              * Estimativa
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
