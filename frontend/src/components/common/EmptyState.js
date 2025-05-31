import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CloudUpload, Folder } from '@mui/icons-material';

const EmptyState = ({
  icon: Icon = CloudUpload,
  title = 'Nenhum ficheiro encontrado',
  description = 'Começa por enviar alguns ficheiros para veres aqui.',
  actionText,
  onAction
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        textAlign: 'center',
        p: 3
      }}
    >
      <Icon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" gutterBottom color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" paragraph>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
