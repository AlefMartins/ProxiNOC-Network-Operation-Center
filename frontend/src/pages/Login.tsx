"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  useTheme,
  IconButton,
  InputAdornment,
} from "@mui/material"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material"
import authService from "../services/authService"

const Login: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar se há um redirecionamento
  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.login({
        username,
        password,
      })
      navigate(from, { replace: true })
    } catch (err: any) {
      console.error("Erro no login:", err)
      setError(err.response?.data?.message || "Erro ao fazer login. Verifique suas credenciais.")
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 35%, ${theme.palette.secondary.main} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: "100%", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              ProxiNOC-GDR
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gerenciamento de Dispositivos Remotos
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Nome de Usuário"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Senha"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Lembrar-me"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="textSecondary" align="center">
            © {new Date().getFullYear()} ProxiNOC-GDR. Todos os direitos reservados.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Login

