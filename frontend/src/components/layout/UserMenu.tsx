"use client"

import type React from "react"
import { useState } from "react"
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material"
import Person from "@mui/icons-material/Person"
import Logout from "@mui/icons-material/Logout"
import { useNavigate } from "react-router-dom"

const UserMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    // Implement your logout logic here
    handleClose()
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    handleClose()
  }

  return (
    <>
      <button onClick={handleClick}>{/* Button content here */}</button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleNavigate("/profile")}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Meu Perfil" />
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu

