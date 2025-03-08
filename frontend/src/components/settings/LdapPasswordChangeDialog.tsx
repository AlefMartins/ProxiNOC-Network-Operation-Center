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
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material"
import { useSnackbar } from "notistack"
import api from "../../services/api"

interface LdapPasswordChangeDialogProps {
  open: boolean
  onClose: () => void
  username: string
}

const LdapPasswordChangeDialog: React.FC<LdapPasswordChangeDialogProps> = ({ open, onClose, username }) => {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { enqueueSnackbar } = useSnackbar()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar campos
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem")
      return
    }

    // Validar requisitos de senha
    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres")
      return
    }

    try {
      setLoading(true)
      const response = await api.post("/ldap/change-password", {
        username,
        oldPassword,
        newPassword,
      })

      if (response.data.success) {
        enqueueSnackbar("Senha alterada com sucesso", { variant: "success" })
        handleClose()
      } else {
        setError(response.data.message || "Erro ao alterar senha")
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      setError(error.response?.data?.message || "Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Alterar Senha LDAP</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Altere sua senha no Active Directory. A nova senha deve atender aos requisitos de complexidade definidos
              pelo administrador do AD.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Senha Atual"
            type="password"
            fullWidth
            margin="normal"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Confirmar Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Alterar Senha"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default LdapPasswordChangeDialog

