"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
  InputAdornment,
  Snackbar,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Terminal as TerminalIcon,
  Dns as DnsIcon,
  Router as RouterIcon,
  SignalCellularAlt as SignalIcon,
  Search as SearchIcon,
} from "@mui/icons-material"
import deviceService, { type Device } from "../services/deviceService"
import { useNavigate } from "react-router-dom"

const Devices: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Partial<Device> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  })

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = devices.filter(
        (device) =>
          device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.ip.includes(searchTerm) ||
          device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredDevices(filtered)
    } else {
      setFilteredDevices(devices)
    }
  }, [searchTerm, devices])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const data = await deviceService.getAllDevices()
      setDevices(data)
      setFilteredDevices(data)
      setError(null)
    } catch (err: any) {
      console.error("Erro ao buscar dispositivos:", err)
      setError("Erro ao carregar dispositivos. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const refreshDevicesStatus = async () => {
    try {
      setRefreshing(true)
      const statuses = await deviceService.checkAllDevicesStatus()

      // Atualizar status dos dispositivos
      const updatedDevices = devices.map((device) => {
        const status = statuses.find((s) => s.id === device.id)
        if (status) {
          return {
            ...device,
            status: status.status,
            latency: status.latency,
            lastSeen: status.lastSeen,
          }
        }
        return device
      })

      setDevices(updatedDevices)
      setFilteredDevices(updatedDevices)

      setSnackbar({
        open: true,
        message: "Status dos dispositivos atualizado com sucesso!",
        severity: "success",
      })
    } catch (err: any) {
      console.error("Erro ao atualizar status dos dispositivos:", err)
      setSnackbar({
        open: true,
        message: "Erro ao atualizar status dos dispositivos.",
        severity: "error",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenDialog = (device: Device | null = null) => {
    if (device) {
      setCurrentDevice({ ...device })
    } else {
      setCurrentDevice({
        name: "",
        ip: "",
        port: 22,
        manufacturer: "",
        model: "",
        description: "",
        sshEnabled: true,
        telnetEnabled: false,
        winboxEnabled: false,
        status: "offline",
        latency: 0,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentDevice(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    if (name) {
      setCurrentDevice((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target
    setCurrentDevice((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setCurrentDevice((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSaveDevice = async () => {
    if (!currentDevice || !currentDevice.name || !currentDevice.ip) {
      setSnackbar({
        open: true,
        message: "Por favor, preencha todos os campos obrigatórios.",
        severity: "error",
      })
      return
    }

    try {
      if (currentDevice.id) {
        // Atualizar dispositivo existente
        await deviceService.updateDevice(currentDevice.id, currentDevice as Device)
        setSnackbar({
          open: true,
          message: "Dispositivo atualizado com sucesso!",
          severity: "success",
        })
      } else {
        // Criar novo dispositivo
        await deviceService.createDevice(currentDevice as Device)
        setSnackbar({
          open: true,
          message: "Dispositivo criado com sucesso!",
          severity: "success",
        })
      }

      // Recarregar lista de dispositivos
      fetchDevices()
      handleCloseDialog()
    } catch (err: any) {
      console.error("Erro ao salvar dispositivo:", err)
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Erro ao salvar dispositivo.",
        severity: "error",
      })
    }
  }

  const handleDeleteDevice = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este dispositivo?")) {
      try {
        await deviceService.deleteDevice(id)

        // Atualizar lista de dispositivos
        setDevices(devices.filter((device) => device.id !== id))
        setFilteredDevices(filteredDevices.filter((device) => device.id !== id))

        setSnackbar({
          open: true,
          message: "Dispositivo excluído com sucesso!",
          severity: "success",
        })
      } catch (err: any) {
        console.error("Erro ao excluir dispositivo:", err)
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Erro ao excluir dispositivo.",
          severity: "error",
        })
      }
    }
  }

  const handleOpenTerminal = (device: Device) => {
    // Armazenar informações do dispositivo para a página do terminal
    localStorage.setItem("selectedDevice", JSON.stringify(device))
    navigate("/terminal")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return theme.palette.success.main
      case "offline":
        return theme.palette.error.main
      case "maintenance":
        return theme.palette.warning.main
      case "error":
        return theme.palette.error.dark
      default:
        return theme.palette.info.main
    }
  }

  const getLatencyColor = (latency: number) => {
    if (latency === 0) return theme.palette.error.main
    if (latency < 10) return theme.palette.success.main
    if (latency < 20) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Dispositivos
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Adicionar Dispositivo
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Lista de Dispositivos
            </Typography>
            <Box>
              <TextField
                size="small"
                label="Buscar dispositivo"
                variant="outlined"
                sx={{ mr: 2 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={refreshDevicesStatus}
                disabled={refreshing}
              >
                Atualizar
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="device table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.primary.light }}>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nome</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>IP</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Porta</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fabricante</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Latência</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Último Acesso</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          Nenhum dispositivo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDevices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((device) => (
                        <TableRow key={device.id} hover>
                          <TableCell>{device.name}</TableCell>
                          <TableCell>{device.ip}</TableCell>
                          <TableCell>{device.port}</TableCell>
                          <TableCell>
                            <Chip
                              icon={<RouterIcon />}
                              label={device.manufacturer}
                              size="small"
                              color={device.manufacturer === "Mikrotik" ? "primary" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={device.status}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(device.status),
                                color: "white",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <SignalIcon sx={{ color: getLatencyColor(device.latency), mr: 1 }} />
                              {device.latency > 0 ? `${device.latency} ms` : "N/A"}
                            </Box>
                          </TableCell>
                          <TableCell>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "N/A"}</TableCell>
                          <TableCell>
                            <Box>
                              <Tooltip title="Terminal SSH">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOpenTerminal(device)}
                                  disabled={device.status !== "online" || !device.sshEnabled}
                                >
                                  <TerminalIcon />
                                </IconButton>
                              </Tooltip>
                              {device.manufacturer === "Mikrotik" && device.winboxEnabled && (
                                <Tooltip title="Winbox">
                                  <IconButton color="secondary" size="small" disabled={device.status !== "online"}>
                                    <DnsIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Editar">
                                <IconButton color="info" size="small" onClick={() => handleOpenDialog(device)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => device.id && handleDeleteDevice(device.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
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
                count={filteredDevices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Device Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentDevice?.id ? "Editar Dispositivo" : "Adicionar Dispositivo"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Dispositivo"
                variant="outlined"
                name="name"
                value={currentDevice?.name || ""}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Endereço IP"
                variant="outlined"
                name="ip"
                value={currentDevice?.ip || ""}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Porta"
                variant="outlined"
                type="number"
                name="port"
                value={currentDevice?.port || 22}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="manufacturer-select-label">Fabricante</InputLabel>
                <Select
                  labelId="manufacturer-select-label"
                  name="manufacturer"
                  value={currentDevice?.manufacturer || ""}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Mikrotik">Mikrotik</MenuItem>
                  <MenuItem value="Cisco">Cisco</MenuItem>
                  <MenuItem value="Fortinet">Fortinet</MenuItem>
                  <MenuItem value="Juniper">Juniper</MenuItem>
                  <MenuItem value="Huawei">Huawei</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Modelo"
                variant="outlined"
                name="model"
                value={currentDevice?.model || ""}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={currentDevice?.status || "offline"}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="maintenance">Manutenção</MenuItem>
                  <MenuItem value="error">Erro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Métodos de Conexão
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>SSH</InputLabel>
                    <Select
                      label="SSH"
                      name="sshEnabled"
                      value={currentDevice?.sshEnabled ? "enabled" : "disabled"}
                      onChange={(e) => {
                        setCurrentDevice((prev) => ({
                          ...prev,
                          sshEnabled: e.target.value === "enabled",
                        }))
                      }}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Telnet</InputLabel>
                    <Select
                      label="Telnet"
                      name="telnetEnabled"
                      value={currentDevice?.telnetEnabled ? "enabled" : "disabled"}
                      onChange={(e) => {
                        setCurrentDevice((prev) => ({
                          ...prev,
                          telnetEnabled: e.target.value === "enabled",
                        }))
                      }}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Winbox</InputLabel>
                    <Select
                      label="Winbox"
                      name="winboxEnabled"
                      value={currentDevice?.winboxEnabled ? "enabled" : "disabled"}
                      onChange={(e) => {
                        setCurrentDevice((prev) => ({
                          ...prev,
                          winboxEnabled: e.target.value === "enabled",
                        }))
                      }}
                      disabled={currentDevice?.manufacturer !== "Mikrotik"}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                variant="outlined"
                multiline
                rows={3}
                name="description"
                value={currentDevice?.description || ""}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveDevice} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Devices

