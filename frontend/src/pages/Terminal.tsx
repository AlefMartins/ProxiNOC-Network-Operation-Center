"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  Divider,
  IconButton,
  Tooltip,
  type SelectChangeEvent,
} from "@mui/material"
import { Terminal as TerminalIcon, Save as SaveIcon } from "@mui/icons-material"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import "xterm/css/xterm.css"
import deviceService, { type Device as ServiceDevice } from "../services/deviceService"

// Interface local para o componente
interface Device extends ServiceDevice {
  username?: string
  password?: string
  enablePassword?: string
}

const Terminal: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<number | "">("")
  const [connectionType, setConnectionType] = useState<string>("ssh")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [currentCommand, setCurrentCommand] = useState("")

  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Carregar dispositivos
    const fetchDevices = async () => {
      try {
        const response = await deviceService.getAllDevices()
        // Converter para o formato local
        const localDevices: Device[] = response.map((device) => ({
          ...device,
          username: "",
          password: "",
          enablePassword: "",
        }))
        setDevices(localDevices)
      } catch (error) {
        console.error("Erro ao buscar dispositivos:", error)
      }
    }

    fetchDevices()

    // Inicializar terminal
    if (terminalRef.current) {
      fitAddonRef.current = new FitAddon()
      xtermRef.current = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "Consolas, monospace",
        theme: {
          background: "#1e1e1e",
          foreground: "#f0f0f0",
          cursor: "#ffffff",
        },
      })

      xtermRef.current.loadAddon(fitAddonRef.current)
      xtermRef.current.open(terminalRef.current)
      fitAddonRef.current.fit()

      xtermRef.current.writeln("Terminal ProxiNOC-GDR")
      xtermRef.current.writeln("Selecione um dispositivo e clique em Conectar")
      xtermRef.current.writeln("")
    }

    // Ajustar tamanho do terminal quando a janela for redimensionada
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (socketRef.current) {
        socketRef.current.close()
      }
      if (xtermRef.current) {
        xtermRef.current.dispose()
      }
    }
  }, [])

  const handleConnect = async () => {
    if (!selectedDevice || !connectionType) return

    setIsLoading(true)
    try {
      if (xtermRef.current) {
        xtermRef.current.clear()
        xtermRef.current.writeln(`Conectando ao dispositivo...`)
      }

      // Aqui você implementaria a lógica de conexão com o dispositivo
      // Usando WebSockets para comunicação em tempo real
      const device = devices.find((d) => d.id === selectedDevice)
      if (!device) return

      // Exemplo de conexão WebSocket (implementação real dependeria do seu backend)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/terminal?deviceId=${selectedDevice}&type=${connectionType}`

      if (socketRef.current) {
        socketRef.current.close()
      }

      socketRef.current = new WebSocket(wsUrl)

      socketRef.current.onopen = () => {
        setIsConnected(true)
        if (xtermRef.current) {
          xtermRef.current.writeln(`Conectado a ${device.name} (${device.ip})`)
        }
      }

      socketRef.current.onmessage = (event) => {
        if (xtermRef.current) {
          xtermRef.current.write(event.data)
        }
      }

      socketRef.current.onclose = () => {
        setIsConnected(false)
        if (xtermRef.current) {
          xtermRef.current.writeln("\r\nConexão encerrada")
        }
      }

      socketRef.current.onerror = (error) => {
        console.error("Erro na conexão WebSocket:", error)
        setIsConnected(false)
        if (xtermRef.current) {
          xtermRef.current.writeln("\r\nErro na conexão")
        }
      }

      // Configurar entrada do terminal
      if (xtermRef.current) {
        xtermRef.current.onData((data) => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(data)
          }
        })
      }
    } catch (error) {
      console.error("Erro ao conectar ao dispositivo:", error)
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\nErro ao conectar: ${error}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close()
    }
    setIsConnected(false)
    if (xtermRef.current) {
      xtermRef.current.writeln("\r\nDesconectado")
    }
  }

  const handleDeviceChange = (event: SelectChangeEvent<number | string>) => {
    setSelectedDevice(event.target.value as number)
  }

  const handleConnectionTypeChange = (event: SelectChangeEvent) => {
    setConnectionType(event.target.value)
  }

  const handleSendCommand = () => {
    if (!currentCommand.trim() || !isConnected || !socketRef.current) return

    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(currentCommand + "\n")
      setCommandHistory([...commandHistory, currentCommand])
      setCurrentCommand("")
    }
  }

  const handleSaveOutput = () => {
    if (!xtermRef.current) return

    // Esta é uma implementação simplificada
    // Em um cenário real, você enviaria os dados para o servidor para salvar
    const output = xtermRef.current.buffer.active.getLine(0)?.translateToString() || ""
    const blob = new Blob([output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `terminal_output_${new Date().toISOString().replace(/:/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
        <TerminalIcon sx={{ mr: 1 }} /> Terminal
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conexão
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="device-select-label">Dispositivo</InputLabel>
                <Select
                  labelId="device-select-label"
                  value={selectedDevice}
                  label="Dispositivo"
                  onChange={handleDeviceChange}
                  disabled={isConnected}
                >
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name} ({device.ip})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="connection-type-label">Tipo de Conexão</InputLabel>
                <Select
                  labelId="connection-type-label"
                  value={connectionType}
                  label="Tipo de Conexão"
                  onChange={handleConnectionTypeChange}
                  disabled={isConnected}
                >
                  <MenuItem value="ssh">SSH</MenuItem>
                  <MenuItem value="telnet">Telnet</MenuItem>
                </Select>
              </FormControl>

              {isConnected ? (
                <Button variant="contained" color="error" fullWidth onClick={handleDisconnect} disabled={isLoading}>
                  Desconectar
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleConnect}
                  disabled={!selectedDevice || isLoading}
                >
                  Conectar
                </Button>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Comandos Rápidos
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!isConnected}
                  onClick={() => {
                    if (socketRef.current) socketRef.current.send("show version\n")
                  }}
                >
                  Show Version
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!isConnected}
                  onClick={() => {
                    if (socketRef.current) socketRef.current.send("show ip interface brief\n")
                  }}
                >
                  Show IP Interfaces
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!isConnected}
                  onClick={() => {
                    if (socketRef.current) socketRef.current.send("show running-config\n")
                  }}
                >
                  Show Running Config
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Tooltip title="Salvar saída">
                  <span>
                    <IconButton onClick={handleSaveOutput} disabled={!isConnected}>
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper
            sx={{
              height: "calc(100vh - 200px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              ref={terminalRef}
              sx={{
                flex: 1,
                backgroundColor: "#1e1e1e",
                overflow: "hidden",
              }}
            />
            <Box sx={{ p: 1, display: "flex", gap: 1, backgroundColor: "#f5f5f5" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Digite um comando..."
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendCommand()
                  }
                }}
                disabled={!isConnected}
              />
              <Button variant="contained" color="primary" onClick={handleSendCommand} disabled={!isConnected}>
                Enviar
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Terminal

