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
  Snackbar,
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
  DriveFileMove,
  ArrowUpward,
  FolderOpen,
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
  onNavigateToPath,
}) => {
  const { downloadFile, moveToTrash, moveItem } = useFiles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [folderDeleteDialog, setFolderDeleteDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [shareDialog, setShareDialog] = useState(false);
  const [itemToShare, setItemToShare] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // Estados para Drag & Drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [dragOverParent, setDragOverParent] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  console.log("=== FileGrid renderizado ===");
  console.log("currentPath:", currentPath);
  console.log("files:", files?.length || 0);
  console.log("folders:", folders?.length || 0);

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, item) => {
    console.log("Drag started:", item);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = (e) => {
    console.log("Drag ended");
    setDraggedItem(null);
    setDragOverFolder(null);
    setDragOverParent(false);
  };

  const handleDragOver = (e, folder) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedItem && folder._id !== draggedItem._id) {
      setDragOverFolder(folder._id);
    }
  };

  const handleDragOverParent = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverParent(true);
    setDragOverFolder(null);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null);
    }
  };

  const handleDragLeaveParent = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverParent(false);
    }
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    console.log("Drop event:", { draggedItem, targetFolder });

    if (!draggedItem || !targetFolder) {
      console.log("Missing draggedItem or targetFolder");
      return;
    }

    if (draggedItem._id === targetFolder._id) {
      console.log("Cannot move item to itself");
      return;
    }

    if (
      draggedItem.type === "folder" &&
      isDescendant(targetFolder._id, draggedItem._id)
    ) {
      setSnackbar({
        open: true,
        message: "Não é possível mover uma pasta para dentro de si mesma",
        severity: "error",
      });
      return;
    }

    try {
      console.log(
        `Moving ${draggedItem.type} "${draggedItem.originalName || draggedItem.name}" to folder "${targetFolder.name}"`
      );

      const result = await moveItem(
        draggedItem._id,
        draggedItem.type,
        targetFolder._id
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${draggedItem.originalName || draggedItem.name} movido para ${targetFolder.name}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || "Erro ao mover item",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error moving item:", error);
      setSnackbar({
        open: true,
        message: "Erro ao mover item",
        severity: "error",
      });
    } finally {
      setDraggedItem(null);
      setDragOverFolder(null);
    }
  };

  const handleDropToParent = async (e) => {
    e.preventDefault();
    console.log("Drop to parent event:", { draggedItem, currentPath });

    if (!draggedItem) {
      console.log("Missing draggedItem");
      return;
    }

    try {
      const parentFolderId =
        currentPath.length > 1 ? currentPath[currentPath.length - 2].id : null;

      console.log(
        `Moving ${draggedItem.type} "${draggedItem.originalName || draggedItem.name}" to parent folder (ID: ${parentFolderId})`
      );

      const result = await moveItem(
        draggedItem._id,
        draggedItem.type,
        parentFolderId
      );

      if (result.success) {
        const parentName = parentFolderId
          ? currentPath[currentPath.length - 2].name
          : "Raiz";

        setSnackbar({
          open: true,
          message: `${draggedItem.originalName || draggedItem.name} movido para ${parentName}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || "Erro ao mover item",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error moving item to parent:", error);
      setSnackbar({
        open: true,
        message: "Erro ao mover item",
        severity: "error",
      });
    } finally {
      setDraggedItem(null);
      setDragOverParent(false);
    }
  };

  const navigateToParent = () => {
    if (currentPath.length > 0 && onNavigateToPath) {
      onNavigateToPath(currentPath.length - 2);
    }
  };

  const isDescendant = (potentialChild, potentialParent) => {
    return false;
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
    ...(folders || []).map((folder) => ({ ...folder, type: "folder" })),
    ...(files || []).map((file) => ({ ...file, type: "file" })),
  ];

  const handleItemClick = (item) => {
    if (item.type === "folder") {
      onFolderClick(item._id);
    } else {
      downloadFile(item);
    }
  };

  // Renderizar card da pasta pai - SEMPRE quando não estamos na raiz
  const renderParentFolderCard = () => {
    if (currentPath.length === 0) return null; // Só não mostrar na raiz

    const parentName =
      currentPath.length > 1
        ? currentPath[currentPath.length - 2].name
        : "Os Meus Ficheiros";

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key="parent-folder">
        <Card
          onDragOver={handleDragOverParent}
          onDragLeave={handleDragLeaveParent}
          onDrop={handleDropToParent}
          sx={{
            height: "100%",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: dragOverParent ? "3px dashed" : "2px solid",
            borderColor: dragOverParent ? "success.main" : "grey.300",
            bgcolor: dragOverParent ? "success.light" : "grey.50",
            transform: dragOverParent ? "scale(1.02)" : "none",
            boxShadow: dragOverParent ? 4 : 1,
            "&:hover": {
              transform: dragOverParent ? "scale(1.02)" : "translateY(-2px)",
              boxShadow: dragOverParent ? 4 : 3,
              borderColor: dragOverParent ? "success.main" : "primary.main",
            },
          }}
          onClick={navigateToParent}
        >
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                height: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: dragOverParent ? "success.main" : "grey.400",
                color: "white",
                flexDirection: "column",
              }}
            >
              <ArrowUpward sx={{ fontSize: 32, mb: 1 }} />
              <FolderOpen sx={{ fontSize: 32 }} />
              {dragOverParent && (
                <Typography
                  variant="caption"
                  sx={{ mt: 1, fontWeight: "bold" }}
                >
                  Mover para aqui
                </Typography>
              )}
            </Box>
          </Box>

          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ArrowBack sx={{ fontSize: 16 }} />
              <Typography
                variant="subtitle2"
                noWrap
                title={`Voltar para ${parentName}`}
                sx={{ fontWeight: "bold" }}
              >
                {parentName}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Clica para voltar ou arrasta itens para mover um nível acima
            </Typography>

            {dragOverParent && (
              <Chip
                label="Soltar aqui"
                size="small"
                color="success"
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  // Renderização de Grid
  const renderGridView = () => (
    <Grid container spacing={2}>
      {/* Card da pasta pai - SEMPRE presente quando não estamos na raiz */}
       {renderParentFolderCard()}

      {/* Cards normais */}
      {allItems.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
          <Card
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={
              item.type === "folder"
                ? (e) => handleDragOver(e, item)
                : undefined
            }
            onDragLeave={item.type === "folder" ? handleDragLeave : undefined}
            onDrop={
              item.type === "folder" ? (e) => handleDrop(e, item) : undefined
            }
            sx={{
              height: "100%",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
              opacity: draggedItem?._id === item._id ? 0.5 : 1,
              transform: dragOverFolder === item._id ? "scale(1.02)" : "none",
              boxShadow: dragOverFolder === item._id ? 4 : 1,
              border: dragOverFolder === item._id ? "2px dashed" : "none",
              borderColor:
                dragOverFolder === item._id ? "primary.main" : "transparent",
              "&:hover": {
                transform:
                  dragOverFolder === item._id
                    ? "scale(1.02)"
                    : "translateY(-2px)",
                boxShadow: dragOverFolder === item._id ? 4 : 3,
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
                    flexDirection: "column",
                  }}
                >
                  <Folder sx={{ fontSize: 48 }} />
                  {dragOverFolder === item._id && (
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, fontWeight: "bold" }}
                    >
                      Soltar aqui
                    </Typography>
                  )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, item);
                }}
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

      {/* Mostrar mensagem se pasta estiver vazia (mas botão pai continua visível) */}
      {allItems.length === 0 && currentPath.length > 0 && (
      <Grid item xs={12}>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Folder sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" gutterBottom>
            Pasta vazia
          </Typography>
          <Typography variant="body2">
            Esta pasta não contém ficheiros ou outras pastas.
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Use o botão acima para voltar à pasta anterior.
          </Typography>
        </Box>
      </Grid>
    )}

      {/* Se estamos na raiz e não há itens */}
      {allItems.length === 0 && currentPath.length === 0 && (
        <Grid item xs={12}>
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: "text.secondary",
            }}
          >
            <InsertDriveFile sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
            <Typography variant="h5" gutterBottom>
              Nenhum ficheiro
            </Typography>
            <Typography variant="body1">
              Ainda não tens ficheiros. Começa por fazer upload de alguns
              ficheiros ou criar novas pastas.
            </Typography>
          </Box>
        </Grid>
      )}
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
          {/* Linha da pasta pai - SEMPRE presente quando não estamos na raiz */}
          {currentPath.length > 0 && (
            <TableRow
              onDragOver={handleDragOverParent}
              onDragLeave={handleDragLeaveParent}
              onDrop={handleDropToParent}
              hover
              sx={{
                cursor: "pointer",
                bgcolor: dragOverParent ? "success.light" : "grey.50",
                border: dragOverParent ? "2px dashed" : "none",
                borderColor: dragOverParent ? "success.main" : "transparent",
                "&:hover": {
                  bgcolor: dragOverParent ? "success.light" : "action.hover",
                },
              }}
              onClick={navigateToParent}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: dragOverParent ? "success.main" : "grey.500",
                    }}
                  >
                    <ArrowUpward />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      <ArrowBack sx={{ fontSize: 16, mr: 1 }} />
                      {currentPath.length > 1
                        ? currentPath[currentPath.length - 2].name
                        : "Os Meus Ficheiros"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Voltar à pasta anterior
                    </Typography>
                  </Box>
                  {dragOverParent && (
                    <Chip label="Soltar aqui" size="small" color="success" />
                  )}
                </Box>
              </TableCell>

              <TableCell>
                <Chip
                  label="Pasta Pai"
                  size="small"
                  color="default"
                  variant="outlined"
                />
              </TableCell>

              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell align="center">—</TableCell>
            </TableRow>
          )}

          {/* Linhas normais */}
          {allItems.map((item) => (
            <TableRow
              key={item._id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              onDragOver={
                item.type === "folder"
                  ? (e) => handleDragOver(e, item)
                  : undefined
              }
              onDragLeave={item.type === "folder" ? handleDragLeave : undefined}
              onDrop={
                item.type === "folder" ? (e) => handleDrop(e, item) : undefined
              }
              hover
              sx={{
                cursor: "pointer",
                opacity: draggedItem?._id === item._id ? 0.5 : 1,
                bgcolor:
                  dragOverFolder === item._id ? "action.hover" : "transparent",
                border: dragOverFolder === item._id ? "2px dashed" : "none",
                borderColor:
                  dragOverFolder === item._id ? "primary.main" : "transparent",
                "&:hover": {
                  bgcolor:
                    dragOverFolder === item._id
                      ? "action.hover"
                      : "action.hover",
                },
              }}
              onClick={() => handleItemClick(item)}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor:
                        item.type === "folder"
                          ? "primary.main"
                          : "secondary.main",
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
                    title={
                      item.type === "folder" ? item.name : item.originalName
                    }
                    sx={{ maxWidth: 200 }}
                  >
                    {item.type === "folder" ? item.name : item.originalName}
                  </Typography>
                  {dragOverFolder === item._id && item.type === "folder" && (
                    <Chip label="Soltar aqui" size="small" color="primary" />
                  )}
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
                    label={`${item.sharedWith.length} pessoa${item.sharedWith.length > 1 ? "s" : ""}`}
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

          {/* Linha para pasta vazia */}
          {allItems.length === 0 && currentPath.length > 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <Folder sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2" gutterBottom>
                    Esta pasta está vazia
                  </Typography>
                  <Typography variant="caption">
                    Use a linha acima para voltar à pasta anterior.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}

          {/* Linha para raiz vazia */}
          {allItems.length === 0 && currentPath.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    color: "text.secondary",
                  }}
                >
                  <InsertDriveFile sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" gutterBottom>
                    Nenhum ficheiro
                  </Typography>
                  <Typography variant="body2">
                    Ainda não tens ficheiros. Começa por fazer upload de alguns
                    ficheiros ou criar novas pastas.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      {/* Barra de Navegação */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          {/* Breadcrumbs */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            {currentPath.length > 0 && (
              <IconButton onClick={goBack} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
            )}

            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              sx={{ flexGrow: 1 }}
            >
              <Link
                component="button"
                variant="body1"
                onClick={() => onNavigateToPath && onNavigateToPath(-1)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color:
                    currentPath.length === 0 ? "primary.main" : "text.primary",
                  fontWeight: currentPath.length === 0 ? "bold" : "normal",
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
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    color:
                      index === currentPath.length - 1
                        ? "primary.main"
                        : "text.primary",
                    fontWeight:
                      index === currentPath.length - 1 ? "bold" : "normal",
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

      {/* Info sobre funcionalidades - só quando há items */}
      {(currentPath.length > 0 || allItems.length > 0) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {currentPath.length > 0
              ? "⬆️ Use o card/linha especial para voltar à pasta anterior ou arraste itens para lá para movê-los um nível acima"
              : "💡 Dica: Arrasta ficheiros e pastas para movê-los para outras pastas"}
          </Typography>
        </Alert>
      )}

      {/* Conteúdo baseado na vista selecionada */}
      {viewMode === "grid" ? renderGridView() : renderListView()}

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
        <MenuItem onClick={handleMenuClose}>
          <DriveFileMove sx={{ mr: 1 }} />
          Mover
        </MenuItem>
        <MenuItem onClick={handleMoveToTrash} sx={{ color: "warning.main" }}>
          <Delete sx={{ mr: 1 }} />
          Mover para Lixo
        </MenuItem>
      </Menu>

      {/* Dialogs */}
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

      <ShareDialog
        open={shareDialog}
        onClose={() => {
          setShareDialog(false);
          setItemToShare(null);
        }}
        item={itemToShare}
        itemType={itemToShare?.originalName ? "file" : "folder"}
      />

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </>
  );
};

export default FileGrid;
