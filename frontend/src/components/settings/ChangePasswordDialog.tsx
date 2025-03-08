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
  LinearProgress,
} from "@mui/material"
import { useSnackbar } from "notistack"
import api from "../../services/api"

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
  userId: number
  username: string
  isLdapUser?: boolean
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  userId,
  username,
  isLdapUser = false,
}) => {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { enqueueSnackbar } = useSnackbar()

  // Calcular força da senha
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { value: 0, color: "error", label: "Muito fraca" }

    let strength = 0

    // Comprimento
    if (password.length >= 8) strength += 20
    if (password.length >= 12) strength += 10

    // Complexidade
    if (/[a-z]/.test(password)) strength += 15
    if (/[A-Z]/.test(password)) strength += 15
    if (/\d/.test(password)) strength += 15
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 25

    // Determinar nível
    if (strength < 30) {
      return { value: strength, color: "error", label: "Muito fraca" }
    } else if (strength < 50) {
      return { value: strength, color: "error", label: "Fraca" }
    } else if (strength < 70) {
      return { value: strength, color: "warning", label: "Média" }
    } else if (strength < 90) {
      return { value: strength, color: "info", label: "Forte" }
    } else {
      return { value: strength, color: "success", label: "Muito forte" }
    }
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar campos
    if (!newPassword || !confirmPassword) {
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

    if (!/[A-Z]/.test(newPassword)) {
      setError("A nova senha deve conter pelo menos uma letra maiúscula")
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setError("A nova senha deve conter pelo menos uma letra minúscula")
      return
    }

    if (!/\d/.test(newPassword)) {
      setError("A nova senha deve conter pelo menos um número")
      return
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setError("A nova senha deve conter pelo menos um caractere especial")
      return
    }

    try {
      setLoading(true)


      // Determinar o endpoint correto com base em se é o próprio usuário ou outro usuário
      const isCurrentUser = userId === (JSON.parse(localStorage.getItem("user") || "{}").id || 0)
      const endpoint = isCurrentUser ? "/password/change" : `/password/change/${userId}`

      console.log(
        `Alterando senha para ${isCurrentUser ? "usuário atual" : "outro usuário"} usando endpoint: ${endpoint}`,
      )

      const response = await api.post(endpoint, {
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
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isLdapUser ? "Alterar Senha LDAP" : "Alterar Senha"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {isLdapUser
                ? "Altere sua senha no Active Directory. A nova senha deve atender aos requisitos de complexidade definidos pelo administrador do AD."
                : "Altere sua senha de acesso ao sistema. A nova senha deve ter pelo menos 8 caracteres."}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />

          {newPassword && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength.value}
                  color={passwordStrength.color as any}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Typography variant="caption" color={`${passwordStrength.color}.main`}>
                  {passwordStrength.label}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres
                especiais.
              </Typography>
            </Box>
          )}

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

export default ChangePasswordDialog

