"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  type SelectChangeEvent,
} from "@mui/material"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { Download as DownloadIcon, Refresh as RefreshIcon } from "@mui/icons-material"
import auditService, { type AuditLogFilter } from "../services/auditService"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Interface local para o componente
interface LocalAuditLog {
  id: number
  userId: number
  username: string
  action: string
  details: string
  ipAddress: string
  userAgent: string
  createdAt: Date
}

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<LocalAuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() - 7)))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [username, setUsername] = useState("")
  const [action, setAction] = useState("")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const filters: AuditLogFilter = {}
      if (startDate) filters.startDate = startDate.toISOString()
      if (endDate) filters.endDate = endDate.toISOString()
      if (username) filters.username = username
      if (action) filters.action = action

      const response = await auditService.getAuditLogs(filters)

      // Converter os logs do serviço para o formato local
      const convertedLogs: LocalAuditLog[] = response.map((log) => ({
        id: log.id,
        userId: log.userId,
        username: log.username,
        action: log.action,
        details: log.details,
        ipAddress: log.ip || "",
        userAgent: "",
        createdAt: new Date(log.createdAt),
      }))

      setLogs(convertedLogs)
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, []) // Updated useEffect dependency array

  const handleRefresh = () => {
    fetchLogs()
  }

  const handleExport = async () => {
    try {
      const filters: AuditLogFilter = {}
      if (startDate) filters.startDate = startDate.toISOString()
      if (endDate) filters.endDate = endDate.toISOString()
      if (username) filters.username = username
      if (action) filters.action = action

      await auditService.exportAuditLogs({
        ...filters,
        format: "json",
      })
    } catch (error) {
      console.error("Erro ao exportar logs de auditoria:", error)
    }
  }

  const handleActionChange = (event: SelectChangeEvent) => {
    setAction(event.target.value)
  }

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "username", headerName: "Usuário", width: 150 },
    { field: "action", headerName: "Ação", width: 150 },
    { field: "details", headerName: "Detalhes", width: 300 },
    { field: "ipAddress", headerName: "Endereço IP", width: 130 },
    {
      field: "createdAt",
      headerName: "Data/Hora",
      width: 180,
      valueFormatter: (params) => {
        return format(new Date(params.value as string), "dd/MM/yyyy HH:mm:ss", {
          locale: ptBR,
        })
      },
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Logs de Auditoria
        </Typography>
        <Box>
          <Tooltip title="Atualizar">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Inicial"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Final"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="action-select-label">Ação</InputLabel>
                <Select labelId="action-select-label" value={action} label="Ação" onChange={handleActionChange}>
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="create">Criação</MenuItem>
                  <MenuItem value="update">Atualização</MenuItem>
                  <MenuItem value="delete">Exclusão</MenuItem>
                  <MenuItem value="command">Comando</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button variant="contained" color="primary" onClick={fetchLogs} fullWidth sx={{ height: "100%" }}>
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ height: "calc(100vh - 300px)", width: "100%" }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  )
}

export default Audit

