import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import SettingsTabs from '../components/settings/SettingsTabs';
import { useSnackbar } from 'notistack';
import api from '../services/api';

/**
 * Página de gerenciamento de usuários
 */
const UserManagementPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar usuários
  useEffect(() => {
    fetchUsers();
  }, []);

  // Buscar usuários da API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Simulação de chamada API - substitua por uma chamada real quando estiver pronta
      setTimeout(() => {
        // Dados de exemplo
        const mockUsers = [
          { 
            id: 1, 
            username: 'admin', 
            full_name: 'Administrador', 
            email: 'admin@example.com', 
            group_name: 'Administradores', 
            auth_type: 'local',
            is_active: true
          },
          { 
            id: 2, 
            username: 'joao.silva', 
            full_name: 'João Silva', 
            email: 'joao.silva@example.com', 
            group_name: 'Operadores', 
            auth_type: 'ldap',
            is_active: true
          },
          { 
            id: 3, 
            username: 'maria.oliveira', 
            full_name: 'Maria Oliveira', 
            email: 'maria.oliveira@example.com', 
            group_name: 'Operadores', 
            auth_type: 'ldap',
            is_active: true
          },
          { 
            id: 4, 
            username: 'pedro.santos', 
            full_name: 'Pedro Santos', 
            email: 'pedro.santos@example.com', 
            group_name: 'Leitura', 
            auth_type: 'local',
            is_active: true
          },
          { 
            id: 5, 
            username: 'ana.costa', 
            full_name: 'Ana Costa', 
            email: 'ana.costa@example.com', 
            group_name: 'Leitura', 
            auth_type: 'ldap',
            is_active: true
          }
        ];

        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
      
      // Quando tiver a API real, use algo como:
      // const response = await api.get('/users');
      // setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      enqueueSnackbar('Erro ao carregar usuários', { variant: 'error' });
      setLoading(false);
    }
  };

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchTermLower) ||
      user.full_name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.group_name.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerenciar configurações do sistema
        </Typography>
      </Box>

      <SettingsTabs />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Gerenciamento de Usuários
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Adicione, edite e remova usuários do sistema
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Buscar usuários..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '350px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {}}
        >
          Adicionar Usuário
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Autenticação</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.group_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.auth_type === 'local' ? "Local" : "LDAP"} 
                      color={user.auth_type === 'local' ? "default" : "primary"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary">
          Importar Usuários
        </Button>
        
        <Button variant="outlined" color="primary">
          Gerenciar Grupos
        </Button>
      </Box>
    </Container>
  );
};

export default UserManagementPage;