"use client"

import type React from "react"
import { useState } from "react"
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Router as DevicesIcon,
  Terminal as TerminalIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  People as UsersIcon,
  Group as GroupsIcon,
  Dns as LdapIcon,
  Email as EmailIcon,
  Tune as SystemIcon,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"

interface SidebarProps {
  open: boolean
  onClose: () => void
  drawerWidth: number
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, drawerWidth }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSettingsClick = () => {
    setSettingsOpen(!settingsOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      onClose()
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/",
    },
    {
      text: "Dispositivos",
      icon: <DevicesIcon />,
      path: "/devices",
    },
    {
      text: "Terminal",
      icon: <TerminalIcon />,
      path: "/terminal",
    },
    {
      text: "Auditoria",
      icon: <AuditIcon />,
      path: "/audit",
    },
  ]

  const settingsItems = [
    {
      text: "Usuários",
      icon: <UsersIcon />,
      path: "/settings/users",
    },
    {
      text: "Grupos",
      icon: <GroupsIcon />,
      path: "/settings/groups",
    },
    {
      text: "LDAP/AD",
      icon: <LdapIcon />,
      path: "/settings/ldap",
    },
    {
      text: "Email",
      icon: <EmailIcon />,
      path: "/settings/email",
    },
    {
      text: "Sistema",
      icon: <SystemIcon />,
      path: "/settings/system",
    },
  ]

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          ProxiNOC-GDR
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              backgroundColor: isActive(item.path) ? "rgba(0, 0, 0, 0.04)" : "transparent",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
          {settingsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {settingsItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  pl: 4,
                  backgroundColor: isActive(item.path) ? "rgba(0, 0, 0, 0.04)" : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </Drawer>
  )
}

export default Sidebar

