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
  Folder,
  InsertDriveFile,
  Share,
  Star,
  Delete,
  Storage,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStorageInfo } from '../../hooks/useStorageInfo';
import { useFavorites } from '../../hooks/useFavorites';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const storageInfo = useStorageInfo();
  const { favorites } = useFavorites();

  const menuItems = [
    { text: 'Os Meus Ficheiros', icon: <InsertDriveFile />, path: '/dashboard' },
    { text: 'Partilhados Comigo', icon: <Share />, path: '/shared' },
    { 
      text: 'Favoritos', 
      icon: <Star />, 
      path: '/favorites',
      badge: favorites.length > 0 ? favorites.length : null
    },
    { text: 'Lixo', icon: <Delete />, path: '/trash' },
  ];

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
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="warning" max={99}>
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

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Storage sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight="medium">
              Armazenamento
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={Math.min(storageInfo.getUsagePercentage(), 100)}
            sx={{
              mb: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: storageInfo.getUsagePercentage() > 80 ? 'error.main' : 'primary.main',
              },
            }}
          />
          
          <Typography variant="caption" color="text.secondary">
            {storageInfo.formattedUsage} de {storageInfo.formattedQuota} utilizados
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
