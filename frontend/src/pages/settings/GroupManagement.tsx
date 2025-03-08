"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Group as GroupIcon,
} from "@mui/icons-material"
import groupService, { type Group, type GroupCreateData, type GroupUpdateData } from "../../services/groupService"
import ldapService from "../../services/ldapService"
import AddGroupDialog from "../../components/settings/AddGroupDialog"
import EditGroupDialog from "../../components/settings/EditGroupDialog"
import ImportLdapGroupsDialog from "../../components/settings/ImportLdapGroupsDialog"
import type { LdapGroup } from "../../types/ldap"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`group-management-tabpanel-${index}`}
      aria-labelledby={`group-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `group-management-tab-${index}`,
    "aria-controls": `group-management-tabpanel-${index}`,
  }
}

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

// Interface para o tipo de erro da API
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tabValue, setTabValue] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Dialog states
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false)
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importLdapDialogOpen, setImportLdapDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "error" | "info" | "success" | "warning",
  })

  // LDAP state
  const [ldapEnabled, setLdapEnabled] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const response = await groupService.getAllGroups()
      setGroups(response)
    } catch (error) {
      console.error("Erro ao buscar grupos:", error)
      setSnackbar({
        open: true,
        message: "Erro ao carregar grupos",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const checkLdapStatus = useCallback(async () => {
    try {
      if (typeof ldapService.isLdapEnabled === "function") {
        const response = await ldapService.isLdapEnabled()
        setLdapEnabled(response.enabled)
      } else {
        console.warn("Método isLdapEnabled não encontrado no serviço LDAP")
        setLdapEnabled(false)
      }
    } catch (error) {
      console.error("Erro ao verificar status LDAP:", error)
      setLdapEnabled(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
    checkLdapStatus()
  }, [fetchGroups, checkLdapStatus])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleAddGroup = () => {
    setAddGroupDialogOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group)
    setEditGroupDialogOpen(true)
  }

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroup(group)
    setDeleteDialogOpen(true)
  }

  const handleAddGroupSubmit = async (groupData: Partial<Group>) => {
    try {
      // Garantir que os campos obrigatórios estejam presentes
      if (!groupData.name) {
        setSnackbar({
          open: true,
          message: "Nome do grupo é obrigatório",
          severity: "error",
        })
        return
      }

      const createData: GroupCreateData = {
        name: groupData.name,
        description: groupData.description,
        groupType: groupData.groupType,
        permissions: groupData.permissions,
      }

      await groupService.createGroup(createData)
      setAddGroupDialogOpen(false)
      setSnackbar({
        open: true,
        message: "Grupo criado com sucesso",
        severity: "success",
      })
      fetchGroups()
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
      let errorMessage = "Erro ao criar grupo"

      // Tratamento seguro do erro com type assertion
      const apiError = error as ApiError
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    }
  }

  const handleEditGroupSubmit = async (groupData: Partial<Group>) => {
    if (!selectedGroup) return

    try {
      const updateData: GroupUpdateData = {
        name: groupData.name,
        description: groupData.description,
        groupType: groupData.groupType,
        permissions: groupData.permissions,
      }

      await groupService.updateGroup(selectedGroup.id, updateData)
      setEditGroupDialogOpen(false)
      setSnackbar({
        open: true,
        message: "Grupo atualizado com sucesso",
        severity: "success",
      })
      fetchGroups()
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error)
      let errorMessage = "Erro ao atualizar grupo"

      // Tratamento seguro do erro com type assertion
      const apiError = error as ApiError
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    }
  }

  const handleDeleteGroupSubmit = async () => {
    if (!selectedGroup) return

    try {
      await groupService.deleteGroup(selectedGroup.id)
      setDeleteDialogOpen(false)
      setSnackbar({
        open: true,
        message: "Grupo excluído com sucesso",
        severity: "success",
      })
      fetchGroups()
    } catch (error) {
      console.error("Erro ao excluir grupo:", error)
      let errorMessage = "Erro ao excluir grupo"

      // Tratamento seguro do erro com type assertion
      const apiError = error as ApiError
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      setDeleteDialogOpen(false)
    }
  }

  const handleImportLdapGroups = async (selectedGroups: LdapGroup[], groupTypes?: Record<string, string>) => {
    setLoading(true)
    try {
      const groupNames = selectedGroups.map((group) => group.name)

      const response = await ldapService.importGroups(groupNames, groupTypes)

      if (response.success) {
        setSnackbar({
          open: true,
          message: `${response.imported} grupos importados com sucesso`,
          severity: "success",
        })
        fetchGroups() // Atualizar a lista
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Erro ao importar grupos",
          severity: "error",
        })
      }
    } catch (error) {
      console.error("Erro ao importar grupos:", error)
      // Corrigir o erro de tipagem para o objeto error
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "response" in error &&
              error.response &&
              typeof error.response === "object" &&
              "data" in error.response &&
              error.response.data &&
              typeof error.response.data === "object" &&
              "message" in error.response.data
            ? String(error.response.data.message)
            : "Erro ao importar grupos"

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Filtrar grupos com base no termo de pesquisa
  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Aplicar paginação
  const paginatedGroups = filteredGroups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gerenciamento de Grupos
        </Typography>
        <Box>
          {ldapEnabled && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<GroupIcon />}
              onClick={() => setImportLdapDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Importar do LDAP
            </Button>
          )}
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddGroup}>
            Novo Grupo
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="group management tabs">
            <Tab label="Grupos" {...a11yProps(0)} />
            
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <TextField
              label="Pesquisar grupos"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mr: 2, flexGrow: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} />,
              }}
            />
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchGroups()} disabled={loading}>
              Atualizar
            </Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de grupos">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Membros</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={40} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum grupo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell component="th" scope="row">
                        {group.name}
                      </TableCell>
                      <TableCell>{group.description || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={convertGroupType(group.groupType)}
                          color={convertGroupType(group.groupType) === "dispositivos" ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{typeof group.members === "number" ? group.members : 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={group.isLdapGroup ? "LDAP" : "Local"}
                          color={group.isLdapGroup ? "primary" : "default"}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleEditGroup(group)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            onClick={() => handleDeleteGroup(group)}
                            size="small"
                            disabled={group.name === "Administrators"}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredGroups.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6">Configurações de Grupos</Typography>
          <Typography variant="body1">Configurações avançadas para gerenciamento de grupos.</Typography>
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <AddGroupDialog
        open={addGroupDialogOpen}
        onClose={() => setAddGroupDialogOpen(false)}
        onSubmit={handleAddGroupSubmit}
      />

      {selectedGroup && (
        <EditGroupDialog
          open={editGroupDialogOpen}
          onClose={() => setEditGroupDialogOpen(false)}
          onSubmit={handleEditGroupSubmit}
          group={selectedGroup}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o grupo "{selectedGroup?.name}"? Esta ação não pode ser desfeita.
            {selectedGroup?.members && selectedGroup.members > 0 && (
              <Typography color="error" sx={{ mt: 2 }}>
                <strong>Atenção:</strong> Este grupo possui {selectedGroup.members} usuário(s) vinculado(s). Você
                precisa remover os usuários do grupo antes de excluí-lo.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteGroupSubmit}
            color="error"
            disabled={Boolean(selectedGroup?.members && selectedGroup.members > 0)}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <ImportLdapGroupsDialog
        open={importLdapDialogOpen}
        onClose={() => setImportLdapDialogOpen(false)}
        onImport={handleImportLdapGroups}
        existingGroupNames={groups.filter((g) => g.isLdapGroup).map((g) => g.name)}
      />

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default GroupManagement

