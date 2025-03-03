import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Container, Typography, Link, CircularProgress } from '@mui/material';
import logo from '../assets/logo.svg';

/**
 * Layout para páginas de autenticação (login, recuperação de senha, etc.)
 */
const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Se o usuário já estiver autenticado, redireciona para a página inicial
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 4 }}>
            <img 
              src={logo} 
              alt="Logo do Sistema" 
              width={100} 
              height={100}
            />
          </Box>

          {/* Conteúdo da página (fornecido pelo Outlet) */}
          <Outlet />
        </Box>
      </Container>

      {/* Rodapé */}
      <Box
        component="footer"
        sx={{
          py: 3,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' '}
            <Link color="inherit" href="#">
              Tacacs LDAP Manager
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;