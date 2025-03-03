import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import SettingsTabs from '../components/settings/SettingsTabs';
import LdapSettings from '../components/settings/LdapSettings';

/**
 * Página de configurações LDAP
 */
const LdapSettingsPage = () => {
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
      
      <LdapSettings />
    </Container>
  );
};

export default LdapSettingsPage;