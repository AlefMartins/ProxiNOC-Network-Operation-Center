// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { CircularProgress, Box } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LdapSettingsPage from './pages/LdapSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App = () => {
  const { verifyAuth } = useAuth();

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return (
    <Routes>
      {/* Rotas de Autenticação */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Rotas Protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Rota temporária para páginas não implementadas */}
        <Route path="/devices" element={<NotFoundPage />} />
        <Route path="/audit" element={<NotFoundPage />} />
        <Route path="/reports" element={<NotFoundPage />} />
        
        {/* Rotas de Usuários & Grupos */}
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/groups" element={<NotFoundPage />} />
        
        {/* Rotas de Configurações */}
        <Route path="/settings">
          <Route index element={<Navigate to="/settings/ldap" replace />} />
          <Route path="visual" element={<NotFoundPage />} />
          <Route path="ldap" element={<LdapSettingsPage />} />
          <Route path="backup" element={<NotFoundPage />} />
          <Route path="email" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Rota 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;