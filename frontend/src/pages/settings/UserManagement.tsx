"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
} from "@mui/material"
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudSync as CloudSyncIcon,
  Search as SearchIcon,
  Key as KeyIcon,
} from "@mui/icons-material"
import userService from "../../services/userService"
import ldapService from "../../services/ldapService"
import groupService from "../../services/groupService"
import authService from "../../services/authService"
import { useNavigate } from "react-router-dom"
import ImportLdapUsersDialog from "../../components/settings/ImportLdapUsersDialog"
import ChangePasswordDialog from "../../components/settings/ChangePasswordDialog"
import type { LdapUser } from "../../types/ldap"

interface User {
  id: number
  username: string
  email: string
  fullName: string
  isLdapUser: boolean
  isActive: boolean
  lastLogin?: string
  groups: Group[]
  password?: string // Adicionado campo de senha
}

interface Group {
  id: number
  name: string
  description?: string
  isLdapGroup?: boolean
  groupType?: string
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [ldapEnabled, setLdapEnabled] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [tabValue, setTabValue] = useState(0)

  // Check if user has permission to access this page
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = authService.hasPermission("users", "view")
      if (!hasPermission) {
        navigate("/access-denied")
      }
    }
    checkPermission()

    // Check if LDAP is enabled
    const checkLdapStatus = async () => {
      try {
        const config = await ldapService.getLdapConfig()
        setLdapEnabled(config.enabled)
      } catch (error) {
        console.error("Error checking LDAP status:", error)
      }
    }

    checkLdapStatus()
  }, [navigate])

  useEffect(() => {
    fetchUsers()
    fetchGroups()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.getAllUsers()
      // Converter explicitamente para o tipo User[]
      setUsers(data as unknown as User[])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      setSnackbar({
        open: true,
        message: "Erro ao carregar usuários",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const data = await groupService.getAllGroups()
      setGroups(data)
    } catch (error) {
      console.error("Erro ao buscar grupos:", error)
    }
  }

  const handleOpenDialog = (user: User | null = null) => {
    if (user) {
      setCurrentUser(user)
      // Verificar se groups existe antes de chamar map
      setSelectedGroups(user.groups ? user.groups.map((g) => g.id) : [])
    } else {
      setCurrentUser({
        username: "",
        email: "",
        fullName: "",
        password: "", // Adicionado campo de senha
        isLdapUser: false,
        isActive: true,
        groups: [],
      })
      setSelectedGroups([])
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentUser(null)
  }

  const handleOpenImportDialog = () => {
    setOpenImportDialog(true)
  }

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false)
  }

  const handleOpenPasswordDialog = (user: User) => {
    setCurrentUser(user)
    setOpenPasswordDialog(true)
  }

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setCurrentUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleGroupChange = (groupId: number) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSaveUser = async () => {
    if (!currentUser || !currentUser.username || !currentUser.email || !currentUser.fullName) {
      setSnackbar({
        open: true,
        message: "Preencha todos os campos obrigatórios",
        severity: "error",
      })
      return
    }

    try {
      if (currentUser.id) {
        // Atualizar usuário existente
        const result = await userService.updateUser(currentUser.id, {
          email: currentUser.email,
          fullName: currentUser.fullName,
          isActive: currentUser.isActive,
          groupIds: selectedGroups,
        })

        if (result) {
          setSnackbar({
            open: true,
            message: "Usuário atualizado com sucesso",
            severity: "success",
          })
        }
      } else {
        // Criar novo usuário
        const result = await userService.createUser({
          username: currentUser.username,
          password: currentUser.password || "",
          email: currentUser.email,
          fullName: currentUser.fullName,
          isActive: currentUser.isActive,
          groupIds: selectedGroups,
        })

        if (result) {
          setSnackbar({
            open: true,
            message: "Usuário criado com sucesso",
            severity: "success",
          })
        }
      }
      fetchUsers()
      handleCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      setSnackbar({
        open: true,
        message: "Erro ao salvar usuário",
        severity: "error",
      })
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) {
      return
    }

    try {
      await userService.deleteUser(id)
      setSnackbar({
        open: true,
        message: "Usuário excluído com sucesso",
        severity: "success",
      })
      fetchUsers()
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      setSnackbar({
        open: true,
        message: "Erro ao excluir usuário",
        severity: "error",
      })
    }
  }

  const handleImportLdapUsers = async (selectedUsers: LdapUser[], userGroups: Record<string, number[]>) => {
    try {
      const usernames = selectedUsers.map((user) => user.username)
      await userService.importLdapUsers(usernames, userGroups)
      setSnackbar({
        open: true,
        message: `${selectedUsers.length} usuários importados com sucesso`,
        severity: "success",
      })
      fetchUsers()
    } catch (error) {
      console.error("Erro ao importar usuários LDAP:", error)
      setSnackbar({
        open: true,
        message: "Erro ao importar usuários do LDAP",
        severity: "error",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Função para converter os tipos antigos para os novos
  const convertGroupType = (oldType: string | undefined): string => {
    if (!oldType) return "sistema"

    // Converter system e admin para sistema, user para dispositivos
    if (oldType === "system" || oldType === "admin") return "sistema"
    if (oldType === "user") return "dispositivos"

    // Se já for um dos novos tipos, retorna ele mesmo
    if (oldType === "sistema" || oldType === "dispositivos") return oldType

    // Caso padrão
    return "sistema"
  }

  // Filtrar grupos por tipo para a interface de usuário
  const systemGroups = groups.filter((group) => convertGroupType(group.groupType) === "sistema")

  const deviceGroups = groups.filter((group) => convertGroupType(group.groupType) === "dispositivos")

  const getAvailableGroups = (isLdapUser: boolean) => {
    // LDAP users can see all groups
    if (isLdapUser) {
      return groups
    }
    // Local users can only see local groups
    return groups.filter((group) => !group.isLdapGroup)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gerenciamento de Usuários
        </Typography>
        <Box>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchUsers} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {ldapEnabled && (
            <Tooltip title="Importar Usuários LDAP">
              <IconButton onClick={handleOpenImportDialog} sx={{ mr: 1 }}>
                <CloudSyncIcon />
              </IconButton>
            </Tooltip>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={!authService.hasPermission("users", "create")}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Buscar usuários"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome de Usuário</TableCell>
                <TableCell>Nome Completo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Grupos</TableCell>
                <TableCell>Último Login</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isLdapUser ? "LDAP" : "Local"}
                        color={user.isLdapUser ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? "Ativo" : "Inativo"}
                        color={user.isActive ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.groups && user.groups.length > 0 ? (
                        user.groups.map((group) => (
                          <Chip key={group.id} label={group.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nenhum grupo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Nunca"}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => handleOpenDialog(user)}
                          size="small"
                          disabled={!authService.hasPermission("users", "edit")}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {!user.isLdapUser && (
                        <Tooltip title="Alterar Senha">
                          <IconButton
                            onClick={() => handleOpenPasswordDialog(user)}
                            size="small"
                            disabled={!authService.hasPermission("users", "edit")}
                          >
                            <KeyIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton
                          onClick={() => handleDeleteUser(user.id)}
                          size="small"
                          disabled={user.username === "admin" || !authService.hasPermission("users", "delete")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para adicionar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentUser?.id ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome de Usuário"
                name="username"
                value={currentUser?.username || ""}
                onChange={handleInputChange}
                disabled={currentUser?.isLdapUser || currentUser?.id !== undefined}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentUser?.email || ""}
                onChange={handleInputChange}
                disabled={currentUser?.isLdapUser || false}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="fullName"
                value={currentUser?.fullName || ""}
                onChange={handleInputChange}
                disabled={currentUser?.isLdapUser || false}
                required
              />
            </Grid>
            <Grid item xs={12}>
              {!currentUser?.id && (
                <TextField
                  fullWidth
                  label="Senha"
                  name="password"
                  type="password"
                  value={currentUser?.password || ""}
                  onChange={handleInputChange}
                  required
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch checked={currentUser?.isActive || false} onChange={handleInputChange} name="isActive" />
                }
                label="Usuário Ativo"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Grupos
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="group tabs">
                  <Tab label="Grupos do Sistema" />
                  <Tab label="Grupos de Dispositivos" />
                </Tabs>
              </Box>

              <Box role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: "auto" }}>
                    <List dense>
                      {systemGroups
                        .filter((group) => currentUser?.isLdapUser || !group.isLdapGroup) // Filter based on user type
                        .map((group) => (
                          <ListItem key={group.id} disablePadding>
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={selectedGroups.includes(group.id)}
                                onChange={() => handleGroupChange(group.id)}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  {group.name}
                                  {group.isLdapGroup && (
                                    <Chip label="AD" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                                  )}
                                </Box>
                              }
                              secondary={group.description}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Paper>
                )}
              </Box>

              <Box role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: "auto" }}>
                    <List dense>
                      {deviceGroups
                        .filter((group) => currentUser?.isLdapUser || !group.isLdapGroup) // Filter based on user type
                        .map((group) => (
                          <ListItem key={group.id} disablePadding>
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={selectedGroups.includes(group.id)}
                                onChange={() => handleGroupChange(group.id)}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  {group.name}
                                  {group.isLdapGroup && (
                                    <Chip label="AD" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                                  )}
                                </Box>
                              }
                              secondary={group.description}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para importar usuários LDAP */}
      <ImportLdapUsersDialog
        open={openImportDialog}
        onClose={handleCloseImportDialog}
        onImport={handleImportLdapUsers}
        existingUsernames={users.filter((u) => u.isLdapUser).map((u) => u.username)}
      />

      {/* Dialog para alterar senha */}
      {currentUser && (
        <ChangePasswordDialog
          open={openPasswordDialog}
          onClose={handleClosePasswordDialog}
          userId={currentUser.id || 0}
          username={currentUser.username || ""}
        />
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

export default UserManagement

