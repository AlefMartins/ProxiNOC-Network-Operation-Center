// frontend/src/components/settings/SettingsTabs.jsx
import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const SettingsTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Determinar a aba ativa com base no caminho atual
  const getActiveTab = () => {
    if (currentPath.includes('/settings/visual')) return 0;
    if (currentPath.includes('/settings/ldap')) return 1;
    if (currentPath.includes('/settings/backup')) return 2;
    if (currentPath.includes('/settings/email')) return 3;
    return 1; // LDAP é o padrão
  };

  // Manipular mudança de aba
  const handleTabChange = (event, newValue) => {
    const paths = [
      '/settings/visual',
      '/settings/ldap',
      '/settings/backup',
      '/settings/email'
    ];
    navigate(paths[newValue]);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={getActiveTab()}
        onChange={handleTabChange}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
        aria-label="configurações do sistema"
      >
        <Tab label="IDENTIDADE VISUAL" value={0} />
        <Tab label="LDAP/AD" value={1} />
        <Tab label="BACKUP" value={2} />
        <Tab label="EMAIL" value={3} />
      </Tabs>
    </Box>
  );
};

export default SettingsTabs;