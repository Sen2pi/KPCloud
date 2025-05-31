import React, { useState, useEffect } from "react";
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Delete,
  Restore,
  DeleteForever,
  MoreVert,
  Warning,
  CleaningServices,
} from "@mui/icons-material";
import { useFiles } from "../contexts/FileContext";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { format } from "date-fns";

import { pt } from "date-fns/locale";

const Trash = () => {
  const {
    trashedItems,
    loading,
    loadTrash,
    restoreFromTrash,
    deletePermanently,
    emptyTrash,
  } = useFiles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [emptyTrashDialog, setEmptyTrashDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

useEffect(() => {
  console.log("Carregando lixo...");
  loadTrash();
}, []); // ADICIONAR ARRAY VAZIO PARA EVITAR LOOP INFINITO

  const handleMenuOpen = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleRestore = () => {
    if (selectedItem) {
      restoreFromTrash(selectedItem);
    }
    handleMenuClose();
  };

  const handleDeletePermanently = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDeletePermanently = () => {
    if (selectedItem) {
      deletePermanently(selectedItem);
    }
    setDeleteDialog(false);
    setSelectedItem(null);
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setEmptyTrashDialog(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/")) return "🖼️";
    if (mimetype?.startsWith("video/")) return "🎥";
    if (mimetype?.startsWith("audio/")) return "🎵";
    if (mimetype === "application/pdf") return "📄";
    return "📁";
  };

  const getDaysUntilDeletion = (deletedAt) => {
    const deleteDate = new Date(deletedAt);
    const autoDeleteDate = new Date(
      deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const now = new Date();
    const daysLeft = Math.ceil((autoDeleteDate - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (loading) {
    return <LoadingSpinner message="A carregar lixo..." />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Lixo
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip
            icon={<Delete />}
            label={`${trashedItems.length} itens`}
            color="error"
            variant="outlined"
          />
          {trashedItems.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CleaningServices />}
              onClick={() => setEmptyTrashDialog(true)}
            >
              Esvaziar Lixo
            </Button>
          )}
        </Box>
      </Box>

      {trashedItems.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Os ficheiros no lixo são automaticamente eliminados após 30 dias.
          Podes restaurá-los ou eliminá-los permanentemente a qualquer momento.
        </Alert>
      )}

      {trashedItems.length === 0 ? (
        <EmptyState
          icon={Delete}
          title="Lixo vazio"
          description="Os ficheiros eliminados aparecerão aqui. Tens 30 dias para os restaurar."
          showLogo={true}
        />
      ) : (
        <Grid container spacing={2}>
          {trashedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card
                sx={{
                  height: "100%",
                  opacity: 0.8,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    opacity: 1,
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
              >
                <Box sx={{ position: "relative" }}>
                  <Box
                    sx={{
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                      fontSize: "3rem",
                    }}
                  >
                    {getFileIcon(item.mimetype)}
                  </Box>

                  <IconButton
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                    }}
                    onClick={(e) => handleMenuOpen(e, item)}
                  >
                    <MoreVert />
                  </IconButton>

                  <Chip
                    label={`${getDaysUntilDeletion(item.deletedAt)} dias`}
                    size="small"
                    color="warning"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                    }}
                  />
                </Box>

                <CardContent>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    title={item.originalName || item.name}
                    gutterBottom
                  >
                    {item.originalName || item.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Eliminado:{" "}
                    {format(new Date(item.deletedAt), "dd/MM/yyyy HH:mm", {
                      locale: pt,
                    })}
                  </Typography>

                  {item.size && (
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(item.size)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRestore}>
          <Restore sx={{ mr: 1 }} />
          Restaurar
        </MenuItem>
        <MenuItem
          onClick={handleDeletePermanently}
          sx={{ color: "error.main" }}
        >
          <DeleteForever sx={{ mr: 1 }} />
          Eliminar Permanentemente
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação para Eliminar Permanentemente */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}   closeAfterTransition={false}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ color: "error.main", mr: 1 }} />
            Eliminar Permanentemente
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres eliminar permanentemente "
            {selectedItem?.originalName || selectedItem?.name}"? Esta ação não
            pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={confirmDeletePermanently}
            color="error"
            variant="contained"
          >
            Eliminar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação para Esvaziar Lixo */}
      <Dialog
        open={emptyTrashDialog}
        onClose={() => setEmptyTrashDialog(false)}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ color: "error.main", mr: 1 }} />
            Esvaziar Lixo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres eliminar permanentemente todos os{" "}
            {trashedItems.length} itens do lixo? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmptyTrashDialog(false)}>Cancelar</Button>
          <Button onClick={handleEmptyTrash} color="error" variant="contained">
            Eliminar Tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Trash;
