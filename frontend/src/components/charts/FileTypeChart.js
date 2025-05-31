import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Image,
  Description,
  Code,
  Archive,
  Movie,
  AudioFile,
  InsertDriveFile,
} from '@mui/icons-material';

const FileTypeChart = ({ statistics }) => {
  const { total, ...fileTypes } = statistics;

  // Configuração dos tipos de ficheiro
  const fileTypeConfig = [
    {
      key: 'images',
      label: 'Imagens',
      icon: <Image />,
      color: '#4caf50', // Verde
      value: fileTypes.images || 0
    },
    {
      key: 'documents',
      label: 'Documentos',
      icon: <Description />,
      color: '#2196f3', // Azul
      value: fileTypes.documents || 0
    },
    {
      key: 'programming',
      label: 'Programação',
      icon: <Code />,
      color: '#ff9800', // Laranja
      value: fileTypes.programming || 0
    },
    {
      key: 'compressed',
      label: 'Compactados',
      icon: <Archive />,
      color: '#9c27b0', // Roxo
      value: fileTypes.compressed || 0
    },
    {
      key: 'videos',
      label: 'Vídeos',
      icon: <Movie />,
      color: '#f44336', // Vermelho
      value: fileTypes.videos || 0
    },
    {
      key: 'audio',
      label: 'Áudio',
      icon: <AudioFile />,
      color: '#00bcd4', // Ciano
      value: fileTypes.audio || 0
    },
    {
      key: 'others',
      label: 'Outros',
      icon: <InsertDriveFile />,
      color: '#795548', // Castanho
      value: fileTypes.others || 0
    }
  ];

  // Filtrar tipos com valor > 0 e ordenar por valor
  const visibleTypes = fileTypeConfig
    .filter(type => type.value > 0)
    .sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Nenhum ficheiro para análise
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <InsertDriveFile sx={{ fontSize: 18 }} />
        Tipos de Ficheiro
        <Chip 
          label={total} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {visibleTypes.map((type) => {
          const percentage = total > 0 ? (type.value / total) * 100 : 0;
          
          return (
            <Box key={type.key}>
              {/* Header da barra */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 0.5
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ color: type.color, display: 'flex' }}>
                    {type.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    {type.label}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {type.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                    ({percentage.toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>

              {/* Barra de progresso */}
              <Tooltip 
                title={`${type.label}: ${type.value} ficheiro${type.value !== 1 ? 's' : ''} (${percentage.toFixed(1)}%)`}
                placement="top"
              >
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: type.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* Resumo */}
      <Box sx={{ 
        mt: 2, 
        pt: 1.5, 
        borderTop: 1, 
        borderColor: 'divider',
        textAlign: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          {visibleTypes.length} tipo{visibleTypes.length !== 1 ? 's' : ''} de ficheiro{visibleTypes.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default FileTypeChart;
