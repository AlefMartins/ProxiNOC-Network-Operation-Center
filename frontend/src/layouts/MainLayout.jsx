// frontend/src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider, 
  Avatar,
  Badge,
  InputBase,
  alpha,
  styled,
  Collapse,
  ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DeviceHub as DevicesIcon,
  Security as AuditoriaIcon,
  Description as ReportsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
  Group as GroupIcon,
  Image as ImageIcon,
  Email as EmailIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// Largura da barra lateral
const drawerWidth = 240;

// Componente de pesquisa estilizado
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const MainLayout = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Estado para submenus
  const [menuOpenStates, setMenuOpenStates] = useState({
    users: false,
    settings: false,
    backup: false
  });

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Alternar estado de abertura de submenu
  const toggleSubmenu = (menu) => {
    setMenuOpenStates({
      ...menuOpenStates,
      [menu]: !menuOpenStates[menu]
    });
  };

  // Navegar para uma rota
  const navigateTo = (path) => {
    navigate(path);
  };

  // Verificar se um item de menu está ativo
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Verificar se um submenu está ativo
  const isSubmenuActive = (basePath) => {
    return location.pathname.startsWith(basePath);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Barra de navegação superior */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 0 }}>
            Tacacs LDAP Manager
          </Typography>
          
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Pesquisar…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton edge="end" color="inherit">
            <Avatar>
              {user?.full_name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Barra lateral */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5'
          },
        }}
        open={open}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List>
            {/* Dashboard */}
            <ListItem 
              button 
              onClick={() => navigateTo('/dashboard')}
              selected={isActive('/dashboard')}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            {/* Dispositivos */}
            <ListItem 
              button 
              onClick={() => navigateTo('/devices')}
              selected={isSubmenuActive('/devices')}
            >
              <ListItemIcon>
                <DevicesIcon />
              </ListItemIcon>
              <ListItemText primary="Dispositivos" />
            </ListItem>
            
            {/* Auditoria */}
            <ListItem 
              button 
              onClick={() => navigateTo('/audit')}
              selected={isSubmenuActive('/audit')}
            >
              <ListItemIcon>
                <AuditoriaIcon />
              </ListItemIcon>
              <ListItemText primary="Auditoria" />
            </ListItem>
            
            {/* Relatórios */}
            <ListItem 
              button 
              onClick={() => navigateTo('/reports')}
              selected={isSubmenuActive('/reports')}
            >
              <ListItemIcon>
                <ReportsIcon />
              </ListItemIcon>
              <ListItemText primary="Relatórios" />
            </ListItem>
            
            <Divider sx={{ my: 1 }} />
            
            {/* Usuários & Grupos */}
            <ListItemButton
              onClick={() => toggleSubmenu('users')}
              selected={isSubmenuActive('/users')}
            >
              <ListItemIcon>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="Usuários & Grupos" />
              {menuOpenStates.users ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={menuOpenStates.users} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/users')}
                  selected={isActive('/users')}
                >
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Usuários" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/groups')}
                  selected={isActive('/groups')}
                >
                  <ListItemIcon>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText primary="Grupos" />
                </ListItemButton>
              </List>
            </Collapse>
            
            {/* Configurações */}
            <ListItemButton
              onClick={() => toggleSubmenu('settings')}
              selected={isSubmenuActive('/settings')}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configurações" />
              {menuOpenStates.settings ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={menuOpenStates.settings} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/settings/visual')}
                  selected={isActive('/settings/visual')}
                >
                  <ListItemIcon>
                    <ImageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Aparência" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/settings/ldap')}
                  selected={isActive('/settings/ldap')}
                >
                  <ListItemIcon>
                    <UsersIcon />
                  </ListItemIcon>
                  <ListItemText primary="LDAP" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/settings/email')}
                  selected={isActive('/settings/email')}
                >
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary="Email" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4 }}
                  onClick={() => navigateTo('/settings/backup')}
                  selected={isActive('/settings/backup')}
                >
                  <ListItemIcon>
                    <BackupIcon />
                  </ListItemIcon>
                  <ListItemText primary="Backup" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>
      
      {/* Conteúdo principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;