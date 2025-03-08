"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Typography,
  Chip,
  type SelectChangeEvent,
} from "@mui/material"
import type { Group } from "../../types/group"
import PermissionsManager from "./PermissionsManager"

interface EditGroupDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (groupData: Partial<Group>) => void
  group: Group
}

// Alterado para apenas "sistema" e "dispositivos"
const GROUP_TYPES = ["sistema", "dispositivos"]

const EditGroupDialog: React.FC<EditGroupDialogProps> = ({ open, onClose, onSubmit, group }) => {
  const [groupData, setGroupData] = useState<Partial<Group>>({
    name: "",
    description: "",
    groupType: "sistema",
    permissions: { dashboard: ["view"] },
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (group) {
      // Converter "system" para "sistema" se for o caso
      const groupType = group.groupType === "system" ? "sistema" : group.groupType || "sistema"

      setGroupData({
        name: group.name,
        description: group.description || "",
        groupType: groupType,
        permissions: group.permissions || { dashboard: ["view"] },
      })
    }
  }, [group])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGroupData((prev) => ({ ...prev, [name]: value }))
    // Limpar erro quando o campo é alterado
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    setGroupData((prev) => ({ ...prev, [name]: value }))
    // Limpar erro quando o campo é alterado
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handlePermissionsChange = (newPermissions: Record<string, string[]>) => {
    setGroupData((prev) => ({
      ...prev,
      permissions: newPermissions,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!groupData.name?.trim()) {
      newErrors.name = "Nome do grupo é obrigatório"
    } else if (groupData.name.length < 3) {
      newErrors.name = "Nome do grupo deve ter pelo menos 3 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(groupData)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Grupo</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Nome do Grupo"
              value={groupData.name}
              onChange={handleTextChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              disabled={group.isLdapGroup} // Não permitir editar nome de grupos LDAP
            />
            {group.isLdapGroup && (
              <Typography variant="caption" color="text.secondary">
                O nome de grupos LDAP não pode ser alterado
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Descrição"
              value={groupData.description}
              onChange={handleTextChange}
              fullWidth
              multiline
              rows={2}
              disabled={group.isLdapGroup} // Não permitir editar descrição de grupos LDAP
            />
            {group.isLdapGroup && (
              <Typography variant="caption" color="text.secondary">
                A descrição de grupos LDAP não pode ser alterada
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="group-type-label">Tipo de Grupo</InputLabel>
              <Select
                labelId="group-type-label"
                name="groupType"
                value={groupData.groupType || "sistema"}
                label="Tipo de Grupo"
                onChange={handleSelectChange}
              >
                {GROUP_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>O tipo de grupo determina as permissões padrão e comportamento no sistema</FormHelperText>
            </FormControl>
          </Grid>
          {group.isLdapGroup && (
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <Chip label="LDAP" color="primary" size="small" sx={{ mr: 1 }} />
                Este é um grupo sincronizado do LDAP/Active Directory
              </Typography>
            </Grid>
          )}
          {!group.isLdapGroup && (
            <Grid item xs={12}>
              <PermissionsManager permissions={groupData.permissions || {}} onChange={handlePermissionsChange} />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditGroupDialog

