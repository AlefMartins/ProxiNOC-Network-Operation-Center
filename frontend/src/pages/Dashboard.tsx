"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Card, CardContent, Grid, Typography, useTheme, LinearProgress } from "@mui/material"
import {
  People as PeopleIcon,
  Router as RouterIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js"
import { Line, Pie, Bar } from "react-chartjs-2"
import deviceService, { type DeviceStats } from "../services/deviceService"
import systemService from "../services/systemService"
import auditService, { type AuditLog } from "../services/auditService"

interface SystemInfoData {
  cpuUsage: number
  totalMem: number
  freeMem: number
  diskSpace: {
    total: number
    free: number
    used: number
  }
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    fill?: boolean
    backgroundColor: string | string[]
    borderColor?: string
    tension?: number
  }>
}

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
    byManufacturer: [],
  })
  const [systemInfo, setSystemInfo] = useState<SystemInfoData>({
    cpuUsage: 0,
    totalMem: 0,
    freeMem: 0,
    diskSpace: { total: 0, free: 0, used: 0 },
  })
  const [activityData, setActivityData] = useState<ChartData>({
    labels: [],
    datasets: [],
  })
  const [commandStats, setCommandStats] = useState<ChartData>({
    labels: [],
    datasets: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Buscar estatísticas dos dispositivos
        const stats = await deviceService.getDeviceStats()
        setDeviceStats(stats)

        // Buscar informações do sistema
        const sysInfo = await systemService.getSystemInfo()
        // Converter para o formato esperado
        setSystemInfo({
          cpuUsage: sysInfo.cpu?.usage || 0,
          totalMem: sysInfo.memory?.total || 0,
          freeMem: sysInfo.memory?.free || 0,
          diskSpace: {
            total: sysInfo.disk?.total || 0,
            free: sysInfo.disk?.free || 0,
            used: sysInfo.disk?.used || 0,
          },
        })

        // Buscar dados de atividade (últimos 7 dias)
        const today = new Date()
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(today.getDate() - 7)

        const auditLogs = await auditService.getAuditLogs({
          startDate: sevenDaysAgo.toISOString(),
          endDate: today.toISOString(),
          limit: 1000,
        })

        // Processar dados para o gráfico de atividade
        const dates = []
        for (let i = 0; i < 7; i++) {
          const date = new Date()
          date.setDate(today.getDate() - i)
          dates.unshift(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))
        }

        // Contar acessos ao sistema e dispositivos por dia
        const systemAccess = new Array(7).fill(0)
        const deviceAccess = new Array(7).fill(0)

        auditLogs.forEach((log: AuditLog) => {
          const logDate = new Date(log.timestamp)
          const dayIndex = 6 - Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))

          if (dayIndex >= 0 && dayIndex < 7) {
            if (log.action === "login" || log.action === "ldap_login") {
              systemAccess[dayIndex]++
            } else if (log.action === "access" || log.action === "command") {
              deviceAccess[dayIndex]++
            }
          }
        })

        setActivityData({
          labels: dates,
          datasets: [
            {
              label: "Acessos ao Sistema",
              data: systemAccess,
              fill: false,
              backgroundColor: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              tension: 0.4,
            },
            {
              label: "Acessos aos Dispositivos",
              data: deviceAccess,
              fill: false,
              backgroundColor: theme.palette.secondary.main,
              borderColor: theme.palette.secondary.main,
              tension: 0.4,
            },
          ],
        })

        // Buscar estatísticas de comandos
        const commandLogs = await auditService.getCommandLogs({
          limit: 1000,
        })

        // Contar comandos por protocolo
        const protocols = { ssh: 0, telnet: 0, winbox: 0 }
        commandLogs.logs.forEach((log) => {
          if (protocols[log.protocol] !== undefined) {
            protocols[log.protocol]++
          }
        })

        setCommandStats({
          labels: ["SSH", "Telnet", "Winbox"],
          datasets: [
            {
              label: "Conexões por Protocolo",
              data: [protocols.ssh, protocols.telnet, protocols.winbox],
              backgroundColor: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main],
            },
          ],
        })
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main])

  // Calcular porcentagem de uso de memória
  const memoryUsage =
    systemInfo.totalMem > 0 ? Math.round(((systemInfo.totalMem - systemInfo.freeMem) / systemInfo.totalMem) * 100) : 0

  // Calcular porcentagem de uso de disco
  const diskUsage =
    systemInfo.diskSpace.total > 0 ? Math.round((systemInfo.diskSpace.used / systemInfo.diskSpace.total) * 100) : 0

  // Dados para o gráfico de pizza
  const pieChartData = {
    labels: ["Online", "Offline", "Em Manutenção"],
    datasets: [
      {
        data: [deviceStats.online, deviceStats.offline, deviceStats.maintenance],
        backgroundColor: [theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main],
        borderColor: [theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main],
        borderWidth: 1,
      },
    ],
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Dashboard
      </Typography>

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Status Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  color: "white",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {deviceStats.total}
                      </Typography>
                      <Typography variant="body2">Dispositivos Cadastrados</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
                  color: "white",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <RouterIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {deviceStats.online}
                      </Typography>
                      <Typography variant="body2">Dispositivos Online</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
                  color: "white",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <SpeedIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {systemInfo.cpuUsage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">Uso de CPU</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(45deg, ${theme.palette.info.main} 30%, ${theme.palette.info.light} 90%)`,
                  color: "white",
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <StorageIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {memoryUsage}%
                      </Typography>
                      <Typography variant="body2">Uso de Memória</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Server Resources */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                Recursos do Servidor
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">CPU</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemInfo.cpuUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={systemInfo.cpuUsage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Memória</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {memoryUsage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={memoryUsage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: theme.palette.warning.main,
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Disco</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {diskUsage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={diskUsage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: theme.palette.success.main,
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                    Atividade do Sistema
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={activityData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top" as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                    Status dos Dispositivos
                  </Typography>
                  <Box sx={{ height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Pie
                      data={pieChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom" as const,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                    Conexões por Protocolo
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={commandStats}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top" as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default Dashboard

