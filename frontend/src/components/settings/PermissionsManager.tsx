"use client"

import type React from "react"
import {
  Box,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Typography,
  Divider,
} from "@mui/material"

interface Permission {
  label: string
  value: string
}

interface PermissionGroup {
  name: string
  permissions: Permission[]
}

interface PermissionsManagerProps {
  permissions: Record<string, string[]>
  onChange: (permissions: Record<string, string[]>) => void
  disabled?: boolean
}

const AVAILABLE_PERMISSIONS: PermissionGroup[] = [
  {
    name: "Dashboard",
    permissions: [{ label: "Visualizar", value: "view" }],
  },
  {
    name: "Dispositivos",
    permissions: [
      { label: "Visualizar", value: "view" },
      { label: "Criar", value: "create" },
      { label: "Editar", value: "edit" },
      { label: "Excluir", value: "delete" },
    ],
  },
  {
    name: "Usuários",
    permissions: [
      { label: "Visualizar", value: "view" },
      { label: "Criar", value: "create" },
      { label: "Editar", value: "edit" },
      { label: "Excluir", value: "delete" },
    ],
  },
  {
    name: "Grupos",
    permissions: [
      { label: "Visualizar", value: "view" },
      { label: "Criar", value: "create" },
      { label: "Editar", value: "edit" },
      { label: "Excluir", value: "delete" },
    ],
  },
  {
    name: "Auditoria",
    permissions: [{ label: "Visualizar", value: "view" }],
  },
  {
    name: "Configurações",
    permissions: [
      { label: "Visualizar", value: "view" },
      { label: "Editar", value: "edit" },
    ],
  },
]

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ permissions, onChange, disabled = false }) => {
  const handlePermissionChange = (resource: string, permission: string) => {
    const currentPermissions = permissions[resource] || []
    const newPermissions = { ...permissions }

    if (currentPermissions.includes(permission)) {
      newPermissions[resource] = currentPermissions.filter((p) => p !== permission)
    } else {
      newPermissions[resource] = [...currentPermissions, permission]
    }

    // Se não houver permissões para um recurso, remover a chave
    if (newPermissions[resource].length === 0) {
      delete newPermissions[resource]
    }

    onChange(newPermissions)
  }

  const hasPermission = (resource: string, permission: string) => {
    return permissions[resource]?.includes(permission) || false
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Permissões do Grupo
      </Typography>
      {AVAILABLE_PERMISSIONS.map((group) => (
        <Paper key={group.name} sx={{ p: 2, mb: 2 }}>
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">{group.name}</FormLabel>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              {group.permissions.map((permission) => (
                <FormControlLabel
                  key={`${group.name.toLowerCase()}-${permission.value}`}
                  control={
                    <Checkbox
                      checked={hasPermission(group.name.toLowerCase(), permission.value)}
                      onChange={() => handlePermissionChange(group.name.toLowerCase(), permission.value)}
                      disabled={disabled}
                    />
                  }
                  label={permission.label}
                />
              ))}
            </FormGroup>
          </FormControl>
        </Paper>
      ))}
    </Box>
  )
}

export default PermissionsManager

