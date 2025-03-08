"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  type AlertColor,
} from "@mui/material"
import { Visibility, VisibilityOff, Save, Send } from "@mui/icons-material"
import emailService, { type EmailConfig } from "../../services/emailService"
import authService from "../../services/authService"

interface NotificationType {
  open: boolean
  message: string
  severity: AlertColor
}

// Interface para o usuário
interface User {
  id: number
  username: string
  fullName: string
  email: string
  groups: Group[]
}

// Interface para o grupo
interface Group {
  id: number
  name: string
  permissions: Record<string, string[]>
}

const EmailSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [testing, setTesting] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [notification, setNotification] = useState<NotificationType>({
    open: false,
    message: "",
    severity: "info",
  })

  const [config, setConfig] = useState<EmailConfig>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    enabled: false,
  })

  // Verificar se o usuário tem permissão para editar
  const [canEdit, setCanEdit] = useState<boolean>(false)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Usar o método hasPermission do authService
        const hasEditPermission = authService.hasPermission("settings", "edit")
        console.log("Permissão de edição:", hasEditPermission) // Debug
        setCanEdit(hasEditPermission)
      } catch (error) {
        console.error("Erro ao verificar permissões:", error)
        setCanEdit(false)
      }
    }

    checkPermissions()
  }, [])

  // Carregar configuração inicial
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const data = await emailService.getEmailConfig()
        if (data) {
          setConfig({
            host: data.host || "",
            port: data.port || 587,
            secure: data.secure || false,
            username: data.username || "",
            password: "", // Não exibir a senha por segurança
            fromEmail: data.fromEmail || "",
            fromName: data.fromName || "",
            enabled: data.enabled || false,
          })
        }
      } catch (error) {
        showNotification("Erro ao carregar configuração de email", "error")
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Manipular alterações nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setConfig((prev: EmailConfig) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Salvar configuração
  const handleSave = async () => {
    try {
      setSaving(true)
      await emailService.updateEmailConfig(config)
      showNotification("Configuração salva com sucesso", "success")
    } catch (error) {
      showNotification("Erro ao salvar configuração", "error")
    } finally {
      setSaving(false)
    }
  }

  // Testar configuração
  const handleTest = async () => {
    try {
      setTesting(true)
      const result = await emailService.testEmail(config)

      if (result.success) {
        showNotification("Email de teste enviado com sucesso", "success")
      } else {
        showNotification(`Falha no envio: ${result.message}`, "error")
      }
    } catch (error) {
      showNotification("Erro ao testar configuração", "error")
    } finally {
      setTesting(false)
    }
  }

  // Exibir notificação
  const showNotification = (message: string, severity: AlertColor = "info") => {
    setNotification({ open: true, message, severity })
  }

  // Fechar notificação
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Configuração de Email (SMTP)
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {/* Servidor SMTP */}
          <Grid item xs={12} md={8}>
            <TextField
              label="Servidor SMTP"
              name="host"
              value={config.host}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              placeholder="smtp.example.com"
              helperText="Endereço do servidor SMTP"
            />
          </Grid>

          {/* Porta */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Porta"
              name="port"
              type="number"
              value={config.port}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              inputProps={{ min: 1, max: 65535 }}
              helperText="Porta do servidor SMTP"
            />
          </Grid>

          {/* Usuário */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Usuário"
              name="username"
              value={config.username}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              placeholder="usuario@example.com"
              helperText="Nome de usuário para autenticação SMTP"
            />
          </Grid>

          {/* Senha */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Senha"
              name="password"
              type={showPassword ? "text" : "password"}
              value={config.password}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              helperText="Senha para autenticação SMTP"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end" disabled={!canEdit}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Email de Origem */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Email de Origem"
              name="fromEmail"
              value={config.fromEmail}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              placeholder="noreply@example.com"
              helperText="Email que aparecerá como remetente"
            />
          </Grid>

          {/* Nome de Exibição */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Nome de Exibição"
              name="fromName"
              value={config.fromName}
              onChange={handleChange}
              fullWidth
              disabled={!canEdit}
              placeholder="ProxiNOC-GDR"
              helperText="Nome que aparecerá como remetente"
            />
          </Grid>

          {/* Opções */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.secure}
                  onChange={handleChange}
                  name="secure"
                  color="primary"
                  disabled={!canEdit}
                />
              }
              label="Usar conexão segura (SSL/TLS)"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={handleChange}
                  name="enabled"
                  color="primary"
                  disabled={!canEdit}
                />
              }
              label="Habilitar envio de emails"
            />
          </Grid>

          {/* Botões */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2} justifyContent="flex-end">
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving || !canEdit}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Send />}
                  onClick={handleTest}
                  disabled={testing || !canEdit || !config.host || !config.username || !config.fromEmail}
                >
                  {testing ? "Enviando..." : "Testar Configuração"}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Notificações */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default EmailSettings

