import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// IMPORTANTE: ThemeProvider deve ser o primeiro provider
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FileProvider } from "./contexts/FileContext";
import { SettingsProvider } from "./contexts/SettingsContext";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SharedFiles from "./pages/SharedFiles";
import Favorites from "./pages/Favorites";
import Trash from "./pages/Trash";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Forum from "./pages/Forum";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { useApiConfig } from "./hooks/useApiConfig";
import { Box } from "@mui/material";
import ForumPost from './pages/ForumPost'; // ADICIONAR 

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="A carregar..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="A carregar..." />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          transition: "all 0.3s ease",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// NOVO COMPONENTE - ADICIONAR ESTA FUNÇÃO
const AppContent = () => {
  // USAR O HOOK AQUI (DENTRO DOS PROVIDERS)
  useApiConfig();

  return (
    <AuthProvider>
      <FileProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SharedFiles />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Favorites />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trash"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Trash />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Forum />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/post/:postId" // ADICIONAR ESTA ROTA
              element={
                <ProtectedRoute>
                  <Layout>
                    <ForumPost />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/404" element={<NotFound />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "var(--toast-bg)",
              color: "var(--toast-color)",
              border: "1px solid var(--toast-border)",
            },
          }}
        />
      </FileProvider>
    </AuthProvider>
  );
};

// MODIFICAR A FUNÇÃO APP PRINCIPAL
function App() {
  return (
    // ORDEM CORRETA: ThemeProvider primeiro
    <ThemeProvider>
      <SettingsProvider>
        {/* USAR O NOVO COMPONENTE APPCONTENT */}
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
