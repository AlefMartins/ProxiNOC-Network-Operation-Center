import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Sync as SyncIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import api from '../../services/api';

const LdapSettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados para gerenciar os dados do formulário
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    server_url: '',
    bind_dn: '',
    bind_password: '',
    search_base: '',
    user_search_filter: '(objectClass=person)',
    group_search_filter: '(objectClass=group)',
    user_username_attribute: 'sAMAccountName',
    user_email_attribute: 'mail',
    user_fullname_attribute: 'displayName',
    group_name_attribute: 'cn',
    is_active: false,
    sync_interval: 60
  });

  // Carregar configuração inicial
  useEffect(() => {
    fetchLdapConfig();
  }, []);

  // Buscar configuração LDAP
  const fetchLdapConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ldap/config');
      
      if (response.data.isConfigured) {
        setIsConfigured(true);
        setFormData({
          ...response.data.config,
          bind_password: '' // Não mostra a senha existente por segurança
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração LDAP:', error);
      enqueueSnackbar('Erro ao carregar configuração LDAP', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Salvar configuração
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/ldap/config', formData);
      enqueueSnackbar('Configuração LDAP salva com sucesso', { variant: 'success' });
      setIsConfigured(true);
      // Recarregar configuração para obter dados atualizados
      await fetchLdapConfig();
    } catch (error) {
      console.error('Erro ao salvar configuração LDAP:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao salvar configuração LDAP';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Testar conexão LDAP
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await api.post('/ldap/test', {
        server_url: formData.server_url,
        bind_dn: formData.bind_dn,
        bind_password: formData.bind_password || undefined
      });
      
      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: 'success' });
      } else {
        enqueueSnackbar(response.data.message, { variant: 'error' });
      }
    } catch (error) {
      console.error('Erro ao testar conexão LDAP:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao testar conexão LDAP';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setTesting(false);
    }
  };

  // Sincronizar usuários LDAP
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/ldap/sync');
      
      if (response.data.success) {
        enqueueSnackbar('Sincronização LDAP iniciada com sucesso', { variant: 'success' });
      } else {
        enqueueSnackbar(response.data.message, { variant: 'error' });
      }
    } catch (error) {
      console.error('Erro ao sincronizar LDAP:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao sincronizar LDAP';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Alternar visibilidade da senha
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Configurações LDAP" 
        subheader="Configure a integração com o servidor LDAP/Active Directory"
      />
      <Divider />
      <CardContent>
        {formData.is_active && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>LDAP Ativado</AlertTitle>
            A autenticação LDAP está habilitada. Usuários configurados com tipo de autenticação LDAP usarão o servidor abaixo.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Configurações Básicas */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Configurações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="URL do Servidor LDAP"
              name="server_url"
              value={formData.server_url}
              onChange={handleChange}
              fullWidth
              required
              helperText="Ex: ldap://ldap.example.com:389 ou ldaps://ldap.example.com:636"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="DN de Bind (usuário de conexão)"
              name="bind_dn"
              value={formData.bind_dn}
              onChange={handleChange}
              fullWidth
              required
              helperText="Ex: cn=admin,dc=example,dc=com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Senha de Bind"
              name="bind_password"
              value={formData.bind_password}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              helperText={isConfigured ? "Deixe em branco para manter a senha atual" : "Senha do usuário de bind"}
              required={!isConfigured}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Base de Busca"
              name="search_base"
              value={formData.search_base}
              onChange={handleChange}
              fullWidth
              required
              helperText="Ex: dc=example,dc=com"
            />
          </Grid>

          {/* Filtros e Atributos */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Filtros e Atributos
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Filtro de Usuário"
              name="user_search_filter"
              value={formData.user_search_filter}
              onChange={handleChange}
              fullWidth
              helperText="Filtro para buscar usuários"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Filtro de Grupo"
              name="group_search_filter"
              value={formData.group_search_filter}
              onChange={handleChange}
              fullWidth
              helperText="Filtro para buscar grupos"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Atributo de Nome de Usuário"
              name="user_username_attribute"
              value={formData.user_username_attribute}
              onChange={handleChange}
              fullWidth
              helperText="Atributo que contém o nome de usuário"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Atributo de Email"
              name="user_email_attribute"
              value={formData.user_email_attribute}
              onChange={handleChange}
              fullWidth
              helperText="Atributo que contém o email do usuário"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Atributo de Nome Completo"
              name="user_fullname_attribute"
              value={formData.user_fullname_attribute}
              onChange={handleChange}
              fullWidth
              helperText="Atributo que contém o nome completo do usuário"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Atributo de Nome do Grupo"
              name="group_name_attribute"
              value={formData.group_name_attribute}
              onChange={handleChange}
              fullWidth
              helperText="Atributo que contém o nome do grupo"
            />
          </Grid>

          {/* Configurações de Sincronização */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Configurações de Sincronização
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              label="Intervalo de Sincronização (minutos)"
              name="sync_interval"
              value={formData.sync_interval}
              onChange={handleChange}
              type="number"
              fullWidth
              inputProps={{ min: 5 }}
              helperText="Intervalo entre sincronizações automáticas (minutos)"
            />
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleChange}
                  name="is_active"
                  color="primary"
                />
              }
              label="Ativar LDAP"
            />
          </Grid>
        </Grid>

        {/* Botões de Ação */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ mr: 2 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={handleTestConnection}
              disabled={testing || !formData.server_url || !formData.bind_dn || (!formData.bind_password && !isConfigured)}
            >
              {testing ? <CircularProgress size={24} /> : 'Testar Conexão'}
            </Button>
          </Box>

          {isConfigured && formData.is_active && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? <CircularProgress size={24} /> : 'Sincronizar Agora'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LdapSettings;