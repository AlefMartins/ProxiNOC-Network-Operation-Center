"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material"
import { Visibility, VisibilityOff, Send as SendIcon, Save as SaveIcon } from "@mui/icons-material"
import emailService, { type EmailConfig } from "../../services/emailService"

const EmailConfigForm: React.FC = () => {
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

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [testing, setTesting] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Carregar configurações iniciais
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const data = await emailService.getEmailConfig()
        setConfig(data)
      } catch (err) {
        console.error("Erro ao carregar configurações de email:", err)
        setError("Erro ao carregar configurações de email")
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Manipular alterações nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setConfig((prev: EmailConfig) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }))
  }

  // Limpar mensagens de erro e sucesso
  const clearMessages = () => {
    setError(null)
    setSuccess(null)
    setTestResult(null)
  }

  // Salvar configurações
  const handleSave = async () => {
    clearMessages()
    try {
      setSaving(true)

      // Salvar configurações
      await emailService.updateEmailConfig(config)
      setSuccess("Configurações salvas com sucesso")
    } catch (err) {
      console.error("Erro ao salvar configurações:", err)
      setError("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  // Testar configurações
  const handleTest = async () => {
    clearMessages()
    try {
      setTesting(true)

      // Testar configurações - enviar as configurações atuais para teste
      const result = await emailService.testEmail(config)
      setTestResult(result)
    } catch (err) {
      console.error("Erro ao testar configurações:", err)
      setError("Erro ao testar configurações")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <CircularProgress />
      </div>
    )
  }

  return (
    <Paper elevation={3} className="p-6">
      <Typography variant="h6" component="h2" gutterBottom>
        Configurações de Email (SMTP)
      </Typography>

      <Divider className="my-4" />

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="mb-4">
          {success}
        </Alert>
      )}

      {testResult && (
        <Alert severity={testResult.success ? "success" : "error"} className="mb-4">
          {testResult.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            label="Servidor SMTP"
            name="host"
            value={config.host}
            onChange={handleChange}
            fullWidth
            placeholder="smtp.example.com"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Porta"
            name="port"
            type="number"
            value={config.port}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 1, max: 65535 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Usuário"
            name="username"
            value={config.username}
            onChange={handleChange}
            fullWidth
            placeholder="usuario@example.com"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Senha"
            name="password"
            type={showPassword ? "text" : "password"}
            value={config.password}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Email de Origem"
            name="fromEmail"
            value={config.fromEmail}
            onChange={handleChange}
            fullWidth
            placeholder="noreply@example.com"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Nome de Exibição"
            name="fromName"
            value={config.fromName}
            onChange={handleChange}
            fullWidth
            placeholder="ProxiNOC-GDR"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={config.secure} onChange={handleChange} name="secure" color="primary" />}
            label="Usar conexão segura (SSL/TLS)"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={config.enabled} onChange={handleChange} name="enabled" color="primary" />}
            label="Habilitar envio de emails"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider className="my-4" />
          <div className="flex justify-end space-x-2">
            <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SendIcon />}
              onClick={handleTest}
              disabled={testing || !config.host || !config.username || !config.fromEmail}
            >
              {testing ? "Enviando..." : "Testar Configuração"}
            </Button>
          </div>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default EmailConfigForm

