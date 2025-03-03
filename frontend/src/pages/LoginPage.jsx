import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, Person } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// Esquema de validação com Yup
const validationSchema = Yup.object({
  username: Yup.string()
    .required('Usuário é obrigatório')
    .min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  password: Yup.string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
});

/**
 * Página de Login
 */
const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Gerenciamento do formulário com Formik
  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log('Tentando login com:', values.username);
      await login(values.username, values.password);
    }
  });

  // Alterna a visibilidade da senha
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        width: '100%', 
        borderRadius: 2 
      }}
    >
      <Typography component="h1" variant="h5" align="center" gutterBottom>
        Acesso ao Sistema
      </Typography>
      
      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
        {/* Campo de usuário */}
        <TextField
          margin="normal"
          fullWidth
          id="username"
          name="username"
          label="Usuário"
          autoComplete="username"
          autoFocus
          value={formik.values.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.username && Boolean(formik.errors.username)}
          helperText={formik.touched.username && formik.errors.username}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        />
        
        {/* Campo de senha */}
        <TextField
          margin="normal"
          fullWidth
          id="password"
          name="password"
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        />
        
        {/* Botão de login */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Entrar'}
        </Button>
      </Box>
    </Paper>
  );
};

export default LoginPage;