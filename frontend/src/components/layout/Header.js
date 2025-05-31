import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  Divider,
  alpha,
} from "@mui/material";
import {
  AccountCircle,
  Notifications,
  Settings,
  Logout,
  Search,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate("/profile");
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    handleMenuClose();
  };

  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  // FUNÇÃO PARA OBTER URL DA FOTO DE PERFIL
  const getProfilePictureUrl = () => {
    if (user?.profilePicture?.filename) {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const imageUrl = `${baseUrl}/uploads/profiles/${user.profilePicture.filename}`;
      console.log("URL da foto no Header:", imageUrl);
      return imageUrl;
    }
    return null;
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(20px)",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        {/* Logo e Nome */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            mr: 2,
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "scale(1.02)",
            },
          }}
          onClick={handleLogoClick}
        >
          <img
            src="/logo.png"
            alt="KPCloud Logo"
            style={{
              height: 32,
              width: "auto",
              marginRight: 12,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          />
          <Typography
            variant="h6"
            component="div"
            fontWeight="bold"
            sx={{
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(45deg, #3b82f6, #8b5cf6)"
                  : "linear-gradient(45deg, #2563eb, #7c3aed)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KPCloud
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Pesquisar">
            <IconButton
              sx={{
                color: "text.primary",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Search />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notificações">
            <IconButton
              sx={{
                color: "text.primary",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Toggle de Tema */}
          <ThemeToggle />

          <Tooltip title="Conta">
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                ml: 1,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Avatar
                src={
                  user?.profilePicture?.filename
                    ? `${(process.env.REACT_APP_API_URL || "http://localhost:5000").replace("/api", "")}/uploads/profiles/${user.profilePicture.filename}`
                    : null
                }
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  border: (theme) =>
                    `2px solid ${theme.palette.background.paper}`,
                  boxShadow: (theme) =>
                    `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                {user?.firstName?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                width: 200,
                mt: 1,
                borderRadius: 2,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                    : "0 8px 32px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2" noWrap>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1 }} />
              Perfil
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <Settings sx={{ mr: 1 }} />
              Definições
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <Logout sx={{ mr: 1 }} />
              Terminar Sessão
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
