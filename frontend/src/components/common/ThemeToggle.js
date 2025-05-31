import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'icon', size = 'medium' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  if (variant === 'switch') {
    return (
      <Box
        onClick={toggleTheme}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 60,
          height: 30,
          borderRadius: 15,
          backgroundColor: isDarkMode ? 'primary.main' : 'grey.300',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          '&:hover': {
            backgroundColor: isDarkMode ? 'primary.dark' : 'grey.400',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: isDarkMode ? 32 : 2,
            width: 26,
            height: 26,
            borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {isDarkMode ? (
            <DarkMode sx={{ fontSize: 16, color: 'grey.700' }} />
          ) : (
            <LightMode sx={{ fontSize: 16, color: 'orange' }} />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Tooltip title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}>
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${muiTheme.palette.divider}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            transform: 'scale(1.05)',
          },
        }}
      >
        {isDarkMode ? (
          <Brightness7 sx={{ color: 'warning.main' }} />
        ) : (
          <Brightness4 sx={{ color: 'text.primary' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
