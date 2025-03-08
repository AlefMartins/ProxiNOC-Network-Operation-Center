"use client"

import type React from "react"
import { useState } from "react"
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress,
  Box,
} from "@mui/material"
import { Visibility, VisibilityOff, Save } from "@mui/icons-material"
import passwordService from "../../services/passwordService"

interface PasswordStrength {
  value: number
  color: "error" | "warning" | "info" | "success"
  label: string
}

const ChangePasswordForm: React.FC = () => {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Calcular força da senha
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { value: 0, color: "error", label: "Muito fraca" }
    }

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

  // Validar formulário
  const validateForm = (): boolean => {
    // Limpar mensagens
    setError(null)

    // Verificar se todos os campos foram preenchidos
    if (!newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios")
      return false
    }

    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      return false
    }

    // Validar complexidade da senha
    const validation = passwordService.validatePasswordComplexity(newPassword)
    if (!validation.valid) {
      setError(validation.message)
      return false
    }

    return true
  }

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar formulário
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      console.log("Enviando solicitação de alteração de senha")

      // Alterar senha
      const result = await passwordService.changePassword(newPassword)
      console.log("Resultado da alteração de senha:", result)

      if (result.success) {
        setSuccess(result.message)
        setError(null)

        // Limpar formulário
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setError(result.message)
        setSuccess(null)
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      setError("Erro ao alterar senha")
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Alterar Senha
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nova Senha"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {newPassword && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.value}
                    color={passwordStrength.color}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="caption" color={`${passwordStrength.color}.main`}>
                    {passwordStrength.label}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e
                  caracteres especiais.
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Confirmar Nova Senha"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" startIcon={<Save />} disabled={loading} fullWidth>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default ChangePasswordForm

