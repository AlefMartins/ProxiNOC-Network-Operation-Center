import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DeviceHub as DeviceHubIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Email as EmailIcon,
  Description as ReportIcon,
  ExpandLess,
  ExpandMore,
  Image as ImageIcon,
  Delete as DeleteIcon,
  RestorePage as RestoreIcon,
  Terminal as TerminalIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

/**
 * Componente da barra lateral
 */
const Sidebar = ({ open, drawerWidth, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  
  // Estado para submenus
  const [menuOpenStates, setMenuOpenStates] = useState({
    devices: false,
    users: false,
    settings: false,
    backup: false
  });

  // Alternar estado de abertura de submenu
  const toggleSubmenu = (menu) => {
    setMenuOpenStates({
      ...menuOpenStates,
      [menu]: !menuOpenStates[menu]
    });
  };

  // Verificar se um menu está ativo
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Verificar se um submenu está ativo
  const isSubmenuActive = (basePath) => {
    return location.pathname.startsWith(basePath);
  };

  // Navegar para uma rota
  const navigateTo = (path) => {
    navigate(path);
  };

  const drawer = (
    <div>
      <Toolbar>
        {/* Logo ou nome do app pode ir aqui */}
      </Toolbar>
      <Divider />
      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/dashboard')}
            onClick={() => navigateTo('/dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Dispositivos */}
        {hasPermission('access_devices') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSubmenuActive('/devices')}
                onClick={() => toggleSubmenu('devices')}
              >
                <ListItemIcon>
                  <DeviceHubIcon />
                </ListItemIcon>
                <ListItemText primary="Dispositivos" />
                {menuOpenStates.devices ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={menuOpenStates.devices} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  selected={isActive('/devices/list')}
                  onClick={() => navigateTo('/devices/list')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <DeviceHubIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Lista de Dispositivos" />
                </ListItemButton>
                {hasPermission('manage_devices') && (
                  <ListItemButton
                    selected={isActive('/devices/new')}
                    onClick={() => navigateTo('/devices/new')}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <DeviceHubIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Novo Dispositivo" />
                  </ListItemButton>
                )}
                <ListItemButton
                  selected={isActive('/devices/terminal')}
                  onClick={() => navigateTo('/devices/terminal')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <TerminalIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Terminal Web" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}

        {/* Auditoria */}
        {hasPermission('view_audit') && (
          <ListItem disablePadding>
            <ListItemButton
              selected={isActive('/audit')}
              onClick={() => navigateTo('/audit')}
            >
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Auditoria" />
            </ListItemButton>
          </ListItem>
        )}

        {/* Relatórios */}
        {hasPermission('view_audit') && (
          <ListItem disablePadding>
            <ListItemButton
              selected={isActive('/reports')}
              onClick={() => navigateTo('/reports')}
            >
              <ListItemIcon>
                <ReportIcon />
              </ListItemIcon>
              <ListItemText primary="Relatórios" />
            </ListItemButton>
          </ListItem>
        )}

        {/* Usuários e Grupos */}
        {hasPermission('manage_users') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSubmenuActive('/users')}
                onClick={() => toggleSubmenu('users')}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Usuários & Grupos" />
                {menuOpenStates.users ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={menuOpenStates.users} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  selected={isActive('/users/list')}
                  onClick={() => navigateTo('/users/list')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Usuários" />
                </ListItemButton>
                {hasPermission('manage_groups') && (
                  <ListItemButton
                    selected={isActive('/users/groups')}
                    onClick={() => navigateTo('/users/groups')}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <GroupIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Grupos" />
                  </ListItemButton>
                )}
              </List>
            </Collapse>
          </>
        )}

        {/* Configurações */}
        {hasPermission('manage_settings') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSubmenuActive('/settings')}
                onClick={() => toggleSubmenu('settings')}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Configurações" />
                {menuOpenStates.settings ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={menuOpenStates.settings} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  selected={isActive('/settings/appearance')}
                  onClick={() => navigateTo('/settings/appearance')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <ImageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Aparência" />
                </ListItemButton>
                <ListItemButton
                  selected={isActive('/settings/ldap')}
                  onClick={() => navigateTo('/settings/ldap')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <GroupIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="LDAP" />
                </ListItemButton>
                <ListItemButton
                  selected={isActive('/settings/email')}
                  onClick={() => navigateTo('/settings/email')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Email" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}

        {/* Backup */}
        {hasPermission('manage_backups') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSubmenuActive('/backups')}
                onClick={() => toggleSubmenu('backup')}
              >
                <ListItemIcon>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText primary="Backup" />
                {menuOpenStates.backup ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={menuOpenStates.backup} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  selected={isActive('/backups/list')}
                  onClick={() => navigateTo('/backups/list')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <BackupIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Lista de Backups" />
                </ListItemButton>
                <ListItemButton
                  selected={isActive('/backups/create')}
                  onClick={() => navigateTo('/backups/create')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <BackupIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Criar Backup" />
                </ListItemButton>
                <ListItemButton
                  selected={isActive('/backups/restore')}
                  onClick={() => navigateTo('/backups/restore')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <RestoreIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Restaurar" />
                </ListItemButton>
                <ListItemButton
                  selected={isActive('/backups/delete')}
                  onClick={() => navigateTo('/backups/delete')}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Gerenciar" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'block', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: open ? drawerWidth : 0,
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;