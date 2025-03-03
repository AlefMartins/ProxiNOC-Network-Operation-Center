import React, { createContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../services/api';

// Criando o contexto de autenticação
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Função para verificar se o usuário está autenticado
  const verifyAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Verificar se existe um token no localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      // Configurar o token no cabeçalho das requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar se o token é válido
      const response = await api.get('/auth/verify');
      
      setUser(response.data.user);
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      
      // Limpar dados de autenticação em caso de erro
      setUser(null);
      setPermissions([]);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para fazer login
  const login = async (username, password) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { username, password });
      
      const { token, user, permissions } = response.data;
      
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      
      // Configurar o token no cabeçalho das requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setPermissions(permissions);
      
      enqueueSnackbar('Login realizado com sucesso!', { variant: 'success' });
      
      // Redirecionar para a página inicial
      navigate('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      
      let message = 'Erro ao realizar login. Tente novamente.';
      
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      
      enqueueSnackbar(message, { variant: 'error' });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Enviar requisição de logout para o servidor
      if (user) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados de autenticação
      setUser(null);
      setPermissions([]);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      enqueueSnackbar('Logout realizado com sucesso!', { variant: 'success' });
      
      // Redirecionar para a página de login
      navigate('/login');
      
      setIsLoading(false);
    }
  };

  // Função para verificar se o usuário tem uma determinada permissão
  const hasPermission = (permission) => {
    if (!permissions || permissions.length === 0) {
      return false;
    }
    
    return permissions.includes(permission);
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated,
        login,
        logout,
        verifyAuth,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};