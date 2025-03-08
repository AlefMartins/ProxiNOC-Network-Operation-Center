"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Snackbar,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
} from "@mui/material"
import { Save as SaveIcon, Refresh as RefreshIcon, Check as CheckIcon } from "@mui/icons-material"
import ldapService from "../../services/ldapService"
import type { LdapConfig } from "../../services/ldapService"
import LdapHelpCard from "../../components/settings/LdapHelpCard"

interface SimpleLdapConfig {
  enabled: boolean
  domain: string
  server: string
  username: string
  password: string
  syncInterval: number
}

const LdapSettings: React.FC = () => {
  const [simpleConfig, setSimpleConfig] = useState<SimpleLdapConfig>({
    enabled: false,
    domain: "",
    server: "",
    username: "",
    password: "",
    syncInterval: 60,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedConfig, setAdvancedConfig] = useState({
    searchBase: "",
    userFilter: "(&(objectClass=person)(sAMAccountName=*))",
    groupFilter: "(&(objectClass=group)(cn=*))",
    userLoginAttribute: "sAMAccountName",
    userNameAttribute: "displayName",
    userEmailAttribute: "mail",
    groupNameAttribute: "cn",
    groupMemberAttribute: "member",
    sslEnabled: false,
    port: 389,
  })

  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    fetchConfig()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Convert domain to DC format
  const domainToDC = (domain: string) => {
    return domain
      .split(".")
      .map((part) => `DC=${part}`)
      .join(",")
  }

  // Parse domain from DC format
  const dcToDomain = (dc: string) => {
    const parts = dc.match(/DC=([^,]+)/gi)
    if (!parts) return ""
    return parts.map((part) => part.replace("DC=", "")).join(".")
  }

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await ldapService.getLdapConfig()
      if (response) {
        // Extract domain from baseDn
        const domain = dcToDomain(response.baseDn)

        setSimpleConfig({
          enabled: response.enabled,
          domain,
          server: response.server || "",
          username: response.bindUser.split(",")[0].replace("CN=", ""),
          password: "",
          syncInterval: response.syncInterval || 60,
        })

        setAdvancedConfig({
          searchBase: response.baseDn,
          userFilter: response.userFilter,
          groupFilter: response.groupFilter,
          userLoginAttribute: response.userLoginAttribute,
          userNameAttribute: response.userNameAttribute,
          userEmailAttribute: response.userEmailAttribute,
          groupNameAttribute: response.groupNameAttribute,
          groupMemberAttribute: response.groupMemberAttribute,
          sslEnabled: response.sslEnabled || false,
          port: response.port || 389,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar configuração LDAP:", error)
      setSnackbar({
        open: true,
        message: "Erro ao buscar configuração LDAP",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSimpleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSimpleConfig({
      ...simpleConfig,
      [name]: type === "checkbox" ? checked : value,
    })

    // If domain changes, update searchBase
    if (name === "domain") {
      setAdvancedConfig({
        ...advancedConfig,
        searchBase: domainToDC(value),
      })
    }
  }

  const handleAdvancedConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAdvancedConfig({
      ...advancedConfig,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Construct full configuration
      const fullConfig: Partial<LdapConfig> = {
        enabled: simpleConfig.enabled,
        server: simpleConfig.server,
        port: advancedConfig.port,
        bindUser: `CN=${simpleConfig.username},CN=Users,${domainToDC(simpleConfig.domain)}`,
        baseDn: showAdvanced ? advancedConfig.searchBase : domainToDC(simpleConfig.domain),
        syncInterval: simpleConfig.syncInterval,
        userFilter: advancedConfig.userFilter,
        groupFilter: advancedConfig.groupFilter,
        userLoginAttribute: advancedConfig.userLoginAttribute,
        userNameAttribute: advancedConfig.userNameAttribute,
        userEmailAttribute: advancedConfig.userEmailAttribute,
        groupNameAttribute: advancedConfig.groupNameAttribute,
        groupMemberAttribute: advancedConfig.groupMemberAttribute,
        sslEnabled: advancedConfig.sslEnabled,
      }

      // Only include password if it was changed
      if (simpleConfig.password) {
        fullConfig.bindPassword = simpleConfig.password
      }

      await ldapService.updateLdapConfig(fullConfig)
      setSnackbar({
        open: true,
        message: "Configuração LDAP salva com sucesso",
        severity: "success",
      })
    } catch (error) {
      console.error("Erro ao salvar configuração LDAP:", error)
      setSnackbar({
        open: true,
        message: "Erro ao salvar configuração LDAP",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    try {
      const result = await ldapService.testLdapConnection()
      setSnackbar({
        open: true,
        message: result.success ? "Conexão LDAP testada com sucesso" : `Falha no teste de conexão: ${result.message}`,
        severity: result.success ? "success" : "error",
      })
    } catch (error: any) {
      console.error("Erro ao testar conexão LDAP:", error)
      setSnackbar({
        open: true,
        message: `Erro ao testar conexão LDAP: ${error.response?.data?.message || error.message}`,
        severity: "error",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncLoading(true)
    try {
      const result = await ldapService.syncLdapUsers()
      setSnackbar({
        open: true,
        message: result.success
          ? `Sincronização concluída: ${result.added} usuários adicionados, ${result.updated} atualizados, ${result.groups} grupos sincronizados`
          : `Falha na sincronização: ${result.message}`,
        severity: result.success ? "success" : "error",
      })
    } catch (error: any) {
      console.error("Erro ao sincronizar LDAP:", error)
      setSnackbar({
        open: true,
        message: `Erro ao sincronizar LDAP: ${error.response?.data?.message || error.message}`,
        severity: "error",
      })
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações LDAP/AD
        </Typography>
        <Box>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchConfig} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Conexão
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={simpleConfig.enabled}
                          onChange={handleSimpleConfigChange}
                          name="enabled"
                          color="primary"
                        />
                      }
                      label="Habilitar Autenticação LDAP/AD"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Domínio"
                      name="domain"
                      value={simpleConfig.domain}
                      onChange={handleSimpleConfigChange}
                      placeholder="marvitel.com.br"
                      helperText="Ex: empresa.com.br"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Servidor"
                      name="server"
                      value={simpleConfig.server}
                      onChange={handleSimpleConfigChange}
                      placeholder="192.168.1.10"
                      helperText="Endereço IP ou hostname do servidor LDAP"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Usuário Administrador"
                      name="username"
                      value={simpleConfig.username}
                      onChange={handleSimpleConfigChange}
                      placeholder="administrator"
                      helperText="Usuário com permissões para buscar no AD"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Senha"
                      name="password"
                      type="password"
                      value={simpleConfig.password}
                      onChange={handleSimpleConfigChange}
                      helperText="Deixe em branco para manter a senha atual"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Intervalo de Sincronização (minutos)"
                      name="syncInterval"
                      type="number"
                      value={simpleConfig.syncInterval}
                      onChange={handleSimpleConfigChange}
                      inputProps={{ min: 15, max: 1440 }}
                      helperText="Mínimo: 15 minutos, Máximo: 24 horas"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvanced}
                          onChange={(e) => setShowAdvanced(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Mostrar Configurações Avançadas"
                    />
                  </Grid>
                </Grid>

                <Collapse in={showAdvanced}>
                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Configurações Avançadas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Base de Busca (Search Base)"
                        name="searchBase"
                        value={advancedConfig.searchBase}
                        onChange={handleAdvancedConfigChange}
                        helperText="Ex: DC=empresa,DC=com,DC=br"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Filtro de Usuários"
                        name="userFilter"
                        value={advancedConfig.userFilter}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Filtro de Grupos"
                        name="groupFilter"
                        value={advancedConfig.groupFilter}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Atributo de Login"
                        name="userLoginAttribute"
                        value={advancedConfig.userLoginAttribute}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Atributo de Nome"
                        name="userNameAttribute"
                        value={advancedConfig.userNameAttribute}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Atributo de Email"
                        name="userEmailAttribute"
                        value={advancedConfig.userEmailAttribute}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Atributo de Nome do Grupo"
                        name="groupNameAttribute"
                        value={advancedConfig.groupNameAttribute}
                        onChange={handleAdvancedConfigChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Porta"
                        name="port"
                        type="number"
                        value={advancedConfig.port}
                        onChange={handleAdvancedConfigChange}
                        inputProps={{ min: 1, max: 65535 }}
                        helperText="Porta do servidor LDAP"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={advancedConfig.sslEnabled}
                            onChange={handleAdvancedConfigChange}
                            name="sslEnabled"
                            color="primary"
                          />
                        }
                        label="Usar SSL/TLS"
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    Salvar Configurações
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={handleTestConnection}
                    disabled={testLoading}
                  >
                    {testLoading ? <CircularProgress size={24} /> : "Testar Conexão"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={handleSyncNow}
                    disabled={syncLoading || !simpleConfig.enabled}
                  >
                    {syncLoading ? <CircularProgress size={24} /> : "Sincronizar Agora"}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <LdapHelpCard showAdvanced={showAdvanced} />
          </Grid>
        </Grid>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LdapSettings

