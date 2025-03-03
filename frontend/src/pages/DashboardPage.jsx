import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton,
  Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  People as PeopleIcon, 
  DeviceHub as DeviceHubIcon,
  Terminal as TerminalIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente para o Dashboard
 */
const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bem-vindo, {user?.full_name || 'Usuário'}!
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Estatísticas */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Usuários
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3">24</Typography>
            </Box>
            <Typography variant="body2">12 online</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Dispositivos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <DeviceHubIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3">18</Typography>
            </Box>
            <Typography variant="body2">15 online, 3 offline</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'success.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Sessões Ativas
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <TerminalIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3">5</Typography>
            </Box>
            <Typography variant="body2">3 SSH, 2 Telnet</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'error.light',
              color: 'error.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Segurança
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <SecurityIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3">2</Typography>
            </Box>
            <Typography variant="body2">2 tentativas de login malsucedidas</Typography>
          </Paper>
        </Grid>
        
        {/* Status do Servidor */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Status do Servidor"
              action={
                <IconButton>
                  <RefreshIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    CPU
                  </Typography>
                  <Typography variant="h6">
                    24%
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Memória
                  </Typography>
                  <Typography variant="h6">
                    42%
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Disco
                  </Typography>
                  <Typography variant="h6">
                    68%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Atividade Recente */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Atividade Recente"
              action={
                <IconButton>
                  <RefreshIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>admin</strong> conectou ao dispositivo <strong>Router-Core</strong> (10 min atrás)
                </Typography>
                <Typography variant="body2">
                  <strong>john.doe</strong> fez login no sistema (30 min atrás)
                </Typography>
                <Typography variant="body2">
                  <strong>admin</strong> adicionou um novo dispositivo <strong>Switch-01</strong> (1 hora atrás)
                </Typography>
                <Typography variant="body2">
                  <strong>jane.smith</strong> alterou configurações LDAP (2 horas atrás)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;