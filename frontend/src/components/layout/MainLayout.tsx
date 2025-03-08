"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { styled } from "@mui/material/styles"
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { Outlet, useNavigate } from "react-router-dom"
import Sidebar from "./Sidebar"
import authService from "../../services/authService"

const drawerWidth = 260

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}))

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}))

const MainLayout: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [open, setOpen] = useState(!isMobile)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Atualizar usuário atual quando o componente for montado
    setCurrentUser(authService.getCurrentUser())
  }, [])

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.logout()
      navigate("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      setIsLoggingOut(false)
      handleMenuClose()
    }
  }

  const handleProfile = () => {
    handleMenuClose()
    navigate("/profile")
  }

  const handleSettings = () => {
    handleMenuClose()
    navigate("/settings/system")
  }

  // Obter as iniciais do nome do usuário para o avatar
  const getUserInitials = () => {
    if (!currentUser || !currentUser.fullName) return "U"

    const nameParts = currentUser.fullName.split(" ")
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open} color="default">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ProxiNOC-GDR
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Notificações">
              <IconButton
                size="large"
                aria-label="show new notifications"
                color="inherit"
                onClick={handleNotificationMenuOpen}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Configurações">
              <IconButton size="large" aria-label="settings" color="inherit" onClick={handleSettings}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Perfil">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>{getUserInitials()}</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", px: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold", color: theme.palette.primary.main }}>
              ProxiNOC-GDR
            </Typography>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        <Divider />
        <Sidebar open={open} onClose={handleDrawerClose} drawerWidth={drawerWidth} />
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleProfile} disabled={isLoggingOut}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Perfil
        </MenuItem>
        <MenuItem onClick={handleSettings} disabled={isLoggingOut}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saindo...
            </>
          ) : (
            <>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Sair
            </>
          )}
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={notificationAnchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
      >
        <MenuItem onClick={handleNotificationMenuClose}>
          <Typography variant="body2" color="primary">
            Dispositivo offline: Router-Core-01
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <Typography variant="body2" color="error">
            Tentativa de login: usuário admin
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <Typography variant="body2" color="success">
            Backup concluído com sucesso
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <Typography variant="body2" color="primary">
            Ver todas as notificações
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default MainLayout

