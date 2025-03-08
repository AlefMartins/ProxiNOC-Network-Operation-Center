"use client"

import type React from "react"
import { useState } from "react"
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
  type SelectChangeEvent,
} from "@mui/material"
import type { Group } from "../../types/group"

interface AddGroupDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (groupData: Partial<Group>) => void
}

// Alterado para apenas "sistema" e "dispositivos"
const GROUP_TYPES = ["sistema", "dispositivos"]

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({ open, onClose, onSubmit }) => {
  const [groupData, setGroupData] = useState<Partial<Group>>({
    name: "",
    description: "",
    groupType: "sistema", // Alterado de "system" para "sistema"
    permissions: { dashboard: ["view"] },
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      // Resetar o formulário
      setGroupData({
        name: "",
        description: "",
        groupType: "sistema",
        permissions: { dashboard: ["view"] },
      })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Novo Grupo</DialogTitle>
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
            />
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
            />
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
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddGroupDialog

