import React, { useState } from "react";
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
  Alert,
  Breadcrumbs,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
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
  Warning,
  Home,
  NavigateNext,
  ViewModule,
  ViewList,
  ArrowBack,
} from "@mui/icons-material";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useFiles } from "../../contexts/FileContext";
import FavoriteButton from "../common/FavoriteButton";
import ShareDialog from "./ShareDialog";

const FileGrid = ({ 
  files, 
  folders, 
  onFolderClick, 
  currentPath = [], 
  onNavigateToPath 
}) => {
  const { downloadFile, moveToTrash } = useFiles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [folderDeleteDialog, setFolderDeleteDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [shareDialog, setShareDialog] = useState(false);
  const [itemToShare, setItemToShare] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  console.log("=== FileGrid renderizado ===");
  console.log("currentPath:", currentPath);
  console.log("files:", files.length);
  console.log("folders:", folders.length);

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleShare = () => {
    console.log("=== handleShare chamado ===", selectedItem);
    setItemToShare(selectedItem);
    setShareDialog(true);
    handleMenuClose();
  };

  const handleMenuOpen = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
    console.log("=== Menu aberto para item ===", item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
    console.log("=== Menu fechado ===");
  };

  const handleDownload = () => {
    if (selectedItem && selectedItem.originalName) {
      downloadFile(selectedItem);
    }
    handleMenuClose();
  };

  const handleMoveToTrash = () => {
    console.log("=== handleMoveToTrash chamado ===", selectedItem);

    if (selectedItem?.type === "folder") {
      setFolderToDelete(selectedItem);
      setFolderDeleteDialog(true);
    } else {
      setItemToDelete(selectedItem);
      setDeleteDialog(true);
    }

    handleMenuClose();
  };

  const confirmMoveToTrash = () => {
    console.log("=== confirmMoveToTrash CHAMADO ===");
    console.log("itemToDelete:", itemToDelete);

    if (itemToDelete) {
      const itemType = itemToDelete.originalName ? "file" : "folder";
      console.log("=== CONFIRMING MOVE TO TRASH ===");
      console.log("Selected item:", itemToDelete);
      console.log("Item type:", itemType);

      if (typeof moveToTrash === "function") {
        console.log("Chamando moveToTrash...");
        moveToTrash(itemToDelete, itemType);
      } else {
        console.error("moveToTrash não é uma função!");
      }
    } else {
      console.error("itemToDelete é null!");
    }

    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const confirmFolderDelete = () => {
    console.log("=== CONFIRMING FOLDER DELETE ===");
    console.log("folderToDelete:", folderToDelete);

    if (folderToDelete) {
      const itemType = "folder";
      console.log("Selected folder:", folderToDelete);

      if (typeof moveToTrash === "function") {
        console.log("Chamando moveToTrash para pasta...");
        moveToTrash(folderToDelete, itemType);
      }
    } else {
      console.error("folderToDelete é null!");
    }

    setFolderDeleteDialog(false);
    setFolderToDelete(null);
  };

  const handleDialogClose = () => {
    console.log("=== Dialog cancelado ===");
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const goBack = () => {
    if (currentPath.length > 0 && onNavigateToPath) {
      onNavigateToPath(currentPath.length - 2);
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/")) return <Image />;
    if (mimetype?.startsWith("video/")) return <VideoFile />;
    if (mimetype?.startsWith("audio/")) return <AudioFile />;
    if (mimetype === "application/pdf") return <PictureAsPdf />;
    if (mimetype?.includes("zip") || mimetype?.includes("rar"))
      return <Archive />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const allItems = [
    ...folders.map((folder) => ({ ...folder, type: "folder" })),
    ...files.map((file) => ({ ...file, type: "file" })),
  ];

  const handleItemClick = (item) => {
    if (item.type === "folder") {
      onFolderClick(item._id);
    } else {
      downloadFile(item);
    }
  };

  // Renderização de Grid
  const renderGridView = () => (
    <Grid container spacing={2}>
      {allItems.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
          <Card
            sx={{
              height: "100%",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 3,
              },
            }}
            onClick={() => handleItemClick(item)}
          >
            <Box sx={{ position: "relative" }}>
              {item.type === "folder" ? (
                <Box
                  sx={{
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: item.color || "#3498db",
                    color: "white",
                  }}
                >
                  <Folder sx={{ fontSize: 48 }} />
                </Box>
              ) : item.mimetype?.startsWith("image/") ? (
                <CardMedia
                  component="img"
                  height="120"
                  image={`/uploads/${item.filename}`}
                  alt={item.originalName}
                  sx={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "grey.100",
                  }}
                >
                  <Avatar
                    sx={{ width: 56, height: 56, bgcolor: "primary.main" }}
                  >
                    {item.type === "folder" ? (
                      <Folder />
                    ) : (
                      getFileIcon(item.mimetype)
                    )}
                  </Avatar>
                </Box>
              )}

              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "50%",
                  backdropFilter: "blur(4px)",
                }}
              >
                <FavoriteButton item={item} size="small" />
              </Box>

              <IconButton
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                  color: "#1565c0",
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
                title={item.type === "folder" ? item.name : item.originalName}
                gutterBottom
              >
                {item.type === "folder" ? item.name : item.originalName}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(item.createdAt), "dd/MM/yyyy", {
                    locale: pt,
                  })}
                </Typography>
                {item.type === "file" && (
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(item.size)}
                  </Typography>
                )}
              </Box>

              {item.type === "file" && item.sharedWith?.length > 0 && (
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
  );

  // Renderização de Lista
  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Tamanho</TableCell>
            <TableCell>Modificado</TableCell>
            <TableCell>Partilhado</TableCell>
            <TableCell>Favorito</TableCell>
            <TableCell align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allItems.map((item) => (
            <TableRow
              key={item._id}
              hover
              sx={{ 
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" }
              }}
              onClick={() => handleItemClick(item)}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: item.type === "folder" ? "primary.main" : "secondary.main"
                    }}
                  >
                    {item.type === "folder" ? (
                      <Folder />
                    ) : (
                      getFileIcon(item.mimetype)
                    )}
                  </Avatar>
                  <Typography
                    variant="body2"
                    noWrap
                    title={item.type === "folder" ? item.name : item.originalName}
                    sx={{ maxWidth: 200 }}
                  >
                    {item.type === "folder" ? item.name : item.originalName}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={item.type === "folder" ? "Pasta" : "Ficheiro"}
                  size="small"
                  color={item.type === "folder" ? "primary" : "default"}
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell>
                {item.type === "file" ? formatFileSize(item.size) : "—"}
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: pt,
                  })}
                </Typography>
              </TableCell>
              
              <TableCell>
                {item.type === "file" && item.sharedWith?.length > 0 ? (
                  <Chip
                    label={`${item.sharedWith.length} pessoa${item.sharedWith.length > 1 ? 's' : ''}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  "—"
                )}
              </TableCell>
              
              <TableCell>
                <FavoriteButton item={item} size="small" />
              </TableCell>
              
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, item);
                  }}
                >
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      {/* Barra de Navegação */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {/* Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {currentPath.length > 0 && (
              <IconButton onClick={goBack} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
            )}
            
            <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ flexGrow: 1 }}>
              <Link
                component="button"
                variant="body1"
                onClick={() => onNavigateToPath && onNavigateToPath(-1)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: currentPath.length === 0 ? 'primary.main' : 'text.primary',
                  fontWeight: currentPath.length === 0 ? 'bold' : 'normal'
                }}
              >
                <Home sx={{ mr: 0.5, fontSize: 20 }} />
                Os Meus Ficheiros
              </Link>
              
              {currentPath.map((pathItem, index) => (
                <Link
                  key={pathItem.id}
                  component="button"
                  variant="body1"
                  onClick={() => onNavigateToPath && onNavigateToPath(index)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: index === currentPath.length - 1 ? 'primary.main' : 'text.primary',
                    fontWeight: index === currentPath.length - 1 ? 'bold' : 'normal'
                  }}
                >
                  <Folder sx={{ mr: 0.5, fontSize: 20 }} />
                  {pathItem.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Toggle de Vista */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="grid">
              <Tooltip title="Vista de Grelha">
                <ViewModule />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list">
              <Tooltip title="Vista de Lista">
                <ViewList />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Conteúdo baseado na vista selecionada */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Menu de contexto */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === "file" && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 1 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={handleShare}>
          <Share sx={{ mr: 1 }} />
          Partilhar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Renomear
        </MenuItem>
        <MenuItem onClick={handleMoveToTrash} sx={{ color: "warning.main" }}>
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
        <DialogTitle>Mover para o Lixo</DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres mover "
            {itemToDelete?.originalName || itemToDelete?.name}" para o lixo?
            Poderás restaurá-lo mais tarde se necessário.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancelar</Button>
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
        onClose={() => {
          setFolderDeleteDialog(false);
          setFolderToDelete(null);
        }}
        closeAfterTransition={false}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ color: "warning.main", mr: 1 }} />
            Mover Pasta para o Lixo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Tens a certeza que queres mover a pasta "{folderToDelete?.name}"
            para o lixo?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Esta pasta pode conter ficheiros e/ou outras pastas. Todo o conteúdo
            será também movido para o lixo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFolderDeleteDialog(false);
              setFolderToDelete(null);
            }}
          >
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

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialog}
        onClose={() => {
          setShareDialog(false);
          setItemToShare(null);
        }}
        item={itemToShare}
        itemType={itemToShare?.originalName ? "file" : "folder"}
      />
    </>
  );
};

export default FileGrid;
