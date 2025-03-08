"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Typography,
  Alert,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material"
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Sync as SyncIcon,
  Info as InfoIcon,
} from "@mui/icons-material"
import ldapService from "../../services/ldapService"
import groupService from "../../services/groupService"
import type { LdapUser } from "../../types/ldap"

interface ImportLdapUsersDialogProps {
  open: boolean
  onClose: () => void
  onImport: (selectedUsers: LdapUser[], userGroups: Record<string, number[]>) => void
  existingUsernames: string[]
}

interface Group {
  id: number
  name: string
  description?: string
  isLdapGroup?: boolean
}

const ImportLdapUsersDialog: React.FC<ImportLdapUsersDialogProps> = ({
  open,
  onClose,
  onImport,
  existingUsernames,
}) => {
  const [users, setUsers] = useState<LdapUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<LdapUser[]>([])
  const [userGroups, setUserGroups] = useState<Record<string, number[]>>({})
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ldapService.getAvailableLdapUsers()
      console.log("LDAP users response:", response) // Debug log

      // Verificar se a resposta é um array
      if (Array.isArray(response)) {
        // Filtrar usuários que já existem
        const availableUsers = response.filter((user: LdapUser) => !existingUsernames.includes(user.username))
        setUsers(availableUsers)
      } else {
        console.error("Resposta inesperada do servidor:", response)
        setError("Formato de resposta inválido do servidor")
        setUsers([])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários LDAP:", error)
      setError("Erro ao buscar usuários LDAP. Verifique a conexão e configurações.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [existingUsernames])

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true)
    try {
      const response = await groupService.getAllGroups()
      setGroups(response)
    } catch (error) {
      console.error("Erro ao buscar grupos:", error)
      setError("Erro ao buscar grupos. Verifique a conexão.")
    } finally {
      setGroupsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchUsers()
      fetchGroups()
    } else {
      setSelectedUsers([])
      setUserGroups({})
      setSearchTerm("")
    }
  }, [open, fetchUsers, fetchGroups])

  const handleToggleUser = (user: LdapUser) => {
    const currentIndex = selectedUsers.findIndex((u) => u.username === user.username)
    const newSelectedUsers = [...selectedUsers]

    if (currentIndex === -1) {
      newSelectedUsers.push(user)
      // Inicializar com os grupos do AD se disponíveis, ou array vazio
      setUserGroups({
        ...userGroups,
        [user.username]: user.groups || [],
      })
    } else {
      newSelectedUsers.splice(currentIndex, 1)
      // Remover usuário de userGroups quando deselecionar
      const newUserGroups = { ...userGroups }
      delete newUserGroups[user.username]
      setUserGroups(newUserGroups)
    }

    setSelectedUsers(newSelectedUsers)
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
      setUserGroups({})
    } else {
      setSelectedUsers([...filteredUsers])

      // Inicializar todos os usuários selecionados com seus grupos do AD ou array vazio
      const newUserGroups = { ...userGroups }
      filteredUsers.forEach((user) => {
        newUserGroups[user.username] = user.groups || []
      })
      setUserGroups(newUserGroups)
    }
  }

  const handleImport = () => {
    onImport(selectedUsers, userGroups)
    onClose()
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Função para verificar se um grupo é do AD
  const isLdapGroup = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId)
    return group?.isLdapGroup || false
  }

  // Função para obter grupos do AD para um usuário
  const getLdapGroupNames = (user: LdapUser) => {
    if (!user.ldapGroups || user.ldapGroups.length === 0) return "Nenhum"
    return user.ldapGroups.join(", ")
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar Usuários LDAP</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Pesquisar usuários..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={24} />
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>

        {loading && users.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: "center" }}>
            Nenhum usuário LDAP disponível para importação.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1">{filteredUsers.length} usuários disponíveis para importação</Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedUsers.length === filteredUsers.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </Box>

            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {filteredUsers.map((user) => (
                <ListItem key={user.username} sx={{ flexDirection: "column", alignItems: "stretch" }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={1}>
                      <Checkbox
                        edge="start"
                        checked={selectedUsers.some((u) => u.username === user.username)}
                        onChange={() => handleToggleUser(user)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </Grid>
                    <Grid item xs={5}>
                      <ListItemText
                        primary={user.fullName || user.username}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {user.username}
                            </Typography>
                            {user.email && ` — ${user.email}`}
                            {user.ldapGroups && user.ldapGroups.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Grupos AD: {getLdapGroupNames(user)}
                                </Typography>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      {selectedUsers.some((u) => u.username === user.username) && (
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel id={`group-select-label-${user.username}`}>Grupos</InputLabel>
                              <Select
                                labelId={`group-select-label-${user.username}`}
                                multiple
                                value={userGroups[user.username] || []}
                                label="Grupos"
                                renderValue={(selected) => (
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {selected.map((groupId) => {
                                      const group = groups.find((g) => g.id === groupId)
                                      return (
                                        <Chip
                                          key={groupId}
                                          label={group ? group.name : groupId}
                                          size="small"
                                          color={isLdapGroup(groupId) ? "primary" : "default"}
                                        />
                                      )
                                    })}
                                  </Box>
                                )}
                                onChange={(event) => {
                                  const selectedGroupIds = event.target.value as number[]
                                  setUserGroups({
                                    ...userGroups,
                                    [user.username]: selectedGroupIds,
                                  })
                                }}
                                disabled={groupsLoading}
                              >
                                {groupsLoading ? (
                                  <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Carregando grupos...
                                  </MenuItem>
                                ) : (
                                  groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                      <Checkbox checked={(userGroups[user.username] || []).includes(group.id)} />
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: "flex", alignItems: "center" }}>
                                            {group.name}
                                            {group.isLdapGroup && (
                                              <Chip
                                                label="AD"
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 1, height: 20 }}
                                              />
                                            )}
                                          </Box>
                                        }
                                        secondary={group.description}
                                      />
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>
                            <Tooltip title="Sincronizar com grupos do AD">
                              <IconButton
                                size="small"
                                sx={{ ml: 1 }}
                                onClick={() => {
                                  // Restaurar os grupos originais do AD
                                  setUserGroups({
                                    ...userGroups,
                                    [user.username]: user.groups || [],
                                  })
                                }}
                              >
                                <SyncIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {user.ldapGroups && user.ldapGroups.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              <InfoIcon fontSize="inherit" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                              Os grupos do AD foram pré-selecionados automaticamente
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleImport}
          color="primary"
          variant="contained"
          disabled={selectedUsers.length === 0 || loading}
          startIcon={<PersonAddIcon />}
        >
          Importar {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportLdapUsersDialog

