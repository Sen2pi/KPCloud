import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Download,
  Share,
  Delete,
  Edit,
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
  PictureAsPdf,
  Archive,
  Folder,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useFiles } from '../../contexts/FileContext';
import FavoriteButton from '../common/FavoriteButton';

const FileGrid = ({ files, folders, onFolderClick }) => {
  const { downloadFile, moveToTrash } = useFiles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleMenuOpen = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDownload = () => {
    if (selectedItem && selectedItem.originalName) {
      downloadFile(selectedItem);
    }
    handleMenuClose();
  };

  const handleMoveToTrash = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

// No FileGrid.js
const confirmMoveToTrash = () => {
  if (selectedItem) {
    const itemType = selectedItem.originalName ? 'file' : 'folder';
    console.log('=== CONFIRMING MOVE TO TRASH ===');
    console.log('Selected item:', selectedItem);
    console.log('Item type:', itemType);
    moveToTrash(selectedItem, itemType);
  }
  setDeleteDialog(false);
  setSelectedItem(null);
};


  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return <Image />;
    if (mimetype?.startsWith('video/')) return <VideoFile />;
    if (mimetype?.startsWith('audio/')) return <AudioFile />;
    if (mimetype === 'application/pdf') return <PictureAsPdf />;
    if (mimetype?.includes('zip') || mimetype?.includes('rar')) return <Archive />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allItems = [
    ...folders.map(folder => ({ ...folder, type: 'folder' })),
    ...files.map(file => ({ ...file, type: 'file' }))
  ];

  return (
    <>
      <Grid container spacing={2}>
        {allItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => {
                if (item.type === 'folder') {
                  onFolderClick(item._id);
                } else {
                  downloadFile(item);
                }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                {item.type === 'folder' ? (
                  <Box
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: item.color || '#3498db',
                      color: 'white',
                    }}
                  >
                    <Folder sx={{ fontSize: 48 }} />
                  </Box>
                ) : item.mimetype?.startsWith('image/') ? (
                  <CardMedia
                    component="img"
                    height="120"
                    image={`/uploads/${item.filename}`}
                    alt={item.originalName}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                      {item.type === 'folder' ? <Folder /> : getFileIcon(item.mimetype)}
                    </Avatar>
                  </Box>
                )}
                
                {/* Botão de Favorito */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <FavoriteButton item={item} size="small" />
                </Box>

                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                  }}
                  onClick={(e) => handleMenuOpen(e, item)}
                >
                  <MoreVert />
                </IconButton>
              </Box>

              <CardContent>
                <Typography
                  variant="subtitle2"
                  noWrap
                  title={item.type === 'folder' ? item.name : item.originalName}
                  gutterBottom
                >
                  {item.type === 'folder' ? item.name : item.originalName}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: pt })}
                  </Typography>
                  {item.type === 'file' && (
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(item.size)}
                    </Typography>
                  )}
                </Box>

                {item.type === 'file' && item.sharedWith?.length > 0 && (
                  <Chip
                    label="Partilhado"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === 'file' && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 1 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} />
          Partilhar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Renomear
        </MenuItem>
        <MenuItem onClick={handleMoveToTrash} sx={{ color: 'warning.main' }}>
          <Delete sx={{ mr: 1 }} />
          Mover para Lixo
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} closeAfterTransition={false}>
        <DialogTitle>
          Mover para o Lixo
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres mover "{selectedItem?.originalName || selectedItem?.name}" para o lixo?
            Poderás restaurá-lo mais tarde se necessário.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmMoveToTrash}
            color="warning"
            variant="contained"
          >
            Mover para Lixo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileGrid;
