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
  Chip,
} from "@mui/material"
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material"
import ldapService from "../../services/ldapService"
import type { LdapGroup } from "../../types/ldap"

interface ImportLdapGroupsDialogProps {
  open: boolean
  onClose: () => void
  onImport: (selectedGroups: LdapGroup[], groupTypes: Record<string, string>) => void
  existingGroupNames: string[]
}

// Alterado para apenas "sistema" e "dispositivos"
const GROUP_TYPES = ["sistema", "dispositivos"]

const ImportLdapGroupsDialog: React.FC<ImportLdapGroupsDialogProps> = ({
  open,
  onClose,
  onImport,
  existingGroupNames,
}) => {
  const [groups, setGroups] = useState<LdapGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<LdapGroup[]>([])
  const [groupTypes, setGroupTypes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ldapService.getAvailableLdapGroups()
      if (Array.isArray(response)) {
        // Filtrar grupos que já existem
        const availableGroups = response.filter((group) => !existingGroupNames.includes(group.name))
        setGroups(availableGroups)
      } else {
        console.error("Resposta inesperada do servidor:", response)
        setError("Formato de resposta inválido do servidor")
        setGroups([])
      }
    } catch (error) {
      console.error("Erro ao buscar grupos LDAP:", error)
      setError("Erro ao buscar grupos LDAP. Verifique a conexão e configurações.")
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [existingGroupNames])

  useEffect(() => {
    if (open) {
      fetchGroups()
    } else {
      setSelectedGroups([])
      setGroupTypes({})
      setSearchTerm("")
    }
  }, [open, fetchGroups])

  const handleToggleGroup = (group: LdapGroup) => {
    const currentIndex = selectedGroups.findIndex((g) => g.name === group.name)
    const newSelectedGroups = [...selectedGroups]

    if (currentIndex === -1) {
      newSelectedGroups.push(group)
      // Definir tipo padrão do grupo
      setGroupTypes({
        ...groupTypes,
        [group.name]: "sistema", // Alterado de "system" para "sistema"
      })
    } else {
      newSelectedGroups.splice(currentIndex, 1)
      // Remover grupo do groupTypes quando deselecionar
      const newGroupTypes = { ...groupTypes }
      delete newGroupTypes[group.name]
      setGroupTypes(newGroupTypes)
    }

    setSelectedGroups(newSelectedGroups)
  }

  const handleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([])
      setGroupTypes({})
    } else {
      setSelectedGroups([...filteredGroups])
      // Definir tipo padrão para todos os grupos
      const newGroupTypes: Record<string, string> = {}
      filteredGroups.forEach((group) => {
        newGroupTypes[group.name] = "sistema" // Alterado de "system" para "sistema"
      })
      setGroupTypes(newGroupTypes)
    }
  }

  const handleChangeGroupType = (groupName: string, type: string) => {
    setGroupTypes({
      ...groupTypes,
      [groupName]: type,
    })
  }

  const handleImport = () => {
    onImport(selectedGroups, groupTypes)
    onClose()
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar Grupos LDAP</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Pesquisar grupos..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: "center" }}>
            Nenhum grupo LDAP disponível para importação.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1">{filteredGroups.length} grupos disponíveis para importação</Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedGroups.length === filteredGroups.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </Box>

            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {filteredGroups.map((group) => (
                <ListItem key={group.name} sx={{ py: 1 }}>
                  <Checkbox
                    edge="start"
                    checked={selectedGroups.some((g) => g.name === group.name)}
                    onChange={() => handleToggleGroup(group)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="subtitle1">{group.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {group.description || "Sem descrição"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Membros: {typeof group.members === "number" ? group.members : 0}
                        </Typography>
                      </Box>
                    }
                  />
                  {selectedGroups.some((g) => g.name === group.name) && (
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id={`group-type-label-${group.name}`}>Tipo</InputLabel>
                      <Select
                        labelId={`group-type-label-${group.name}`}
                        value={groupTypes[group.name] || "sistema"}
                        onChange={(e) => handleChangeGroupType(group.name, e.target.value)}
                        label="Tipo"
                      >
                        {GROUP_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            <Chip label={type} size="small" color={type === "dispositivos" ? "primary" : "default"} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
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
          disabled={selectedGroups.length === 0 || loading}
          startIcon={<AddIcon />}
        >
          Importar {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportLdapGroupsDialog

