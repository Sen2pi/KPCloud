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
  Alert, // ADICIONAR ESTA LINHA
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
  Warning, // ADICIONAR ESTA LINHA
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
  const [itemToDelete, setItemToDelete] = useState(null);
  const [folderDeleteDialog, setFolderDeleteDialog] = useState(false);
  const [folderDeleteInfo, setFolderDeleteInfo] = useState(null);

  console.log('=== FileGrid renderizado ===');
  console.log('moveToTrash function:', moveToTrash);
  console.log('downloadFile function:', downloadFile);

  const handleMenuOpen = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
    console.log('=== Menu aberto para item ===', item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
    console.log('=== Menu fechado ===');
  };

  const handleDownload = () => {
    if (selectedItem && selectedItem.originalName) {
      downloadFile(selectedItem);
    }
    handleMenuClose();
  };

  const handleMoveToTrash = () => {
    console.log('=== handleMoveToTrash chamado ===', selectedItem);
    
    // Se for uma pasta, mostrar aviso especial
    if (selectedItem?.type === 'folder') {
      setFolderDeleteInfo({
        folderName: selectedItem.name,
        hasContent: true // Assumir que pode ter conteúdo
      });
      setFolderDeleteDialog(true);
    } else {
      setItemToDelete(selectedItem);
      setDeleteDialog(true);
    }
    
    handleMenuClose();
  };

  const confirmMoveToTrash = () => {
    console.log('=== confirmMoveToTrash CHAMADO ===');
    console.log('itemToDelete:', itemToDelete);
    
    if (itemToDelete) {
      const itemType = itemToDelete.originalName ? 'file' : 'folder';
      console.log('=== CONFIRMING MOVE TO TRASH ===');
      console.log('Selected item:', itemToDelete);
      console.log('Item type:', itemType);
      console.log('moveToTrash function exists:', typeof moveToTrash === 'function');
      
      if (typeof moveToTrash === 'function') {
        console.log('Chamando moveToTrash...');
        moveToTrash(itemToDelete, itemType);
      } else {
        console.error('moveToTrash não é uma função!');
      }
    } else {
      console.error('itemToDelete é null!');
    }
    
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const confirmFolderDelete = () => {
    if (selectedItem) {
      const itemType = 'folder';
      console.log('=== CONFIRMING FOLDER DELETE ===');
      console.log('Selected item:', selectedItem);
      
      if (typeof moveToTrash === 'function') {
        console.log('Chamando moveToTrash para pasta...');
        moveToTrash(selectedItem, itemType);
      }
    }
    
    setFolderDeleteDialog(false);
    setFolderDeleteInfo(null);
    setSelectedItem(null);
  };

  const handleDialogClose = () => {
    console.log('=== Dialog cancelado ===');
    setDeleteDialog(false);
    setItemToDelete(null);
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

      {/* Dialog de Confirmação para Ficheiros */}
      <Dialog 
        open={deleteDialog} 
        onClose={handleDialogClose}
        closeAfterTransition={false}
      >
        <DialogTitle>
          Mover para o Lixo
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres mover "{itemToDelete?.originalName || itemToDelete?.name}" para o lixo?
            Poderás restaurá-lo mais tarde se necessário.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
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

      {/* Dialog de Confirmação para Pastas */}
      <Dialog 
        open={folderDeleteDialog} 
        onClose={() => setFolderDeleteDialog(false)}
        closeAfterTransition={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ color: 'warning.main', mr: 1 }} />
            Mover Pasta para o Lixo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Tens a certeza que queres mover a pasta "{folderDeleteInfo?.folderName}" para o lixo?
          </Typography>
          {folderDeleteInfo?.hasContent && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Esta pasta pode conter ficheiros e/ou outras pastas. Todo o conteúdo será também movido para o lixo.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmFolderDelete}
            color="warning"
            variant="contained"
          >
            Mover Tudo para o Lixo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileGrid;
