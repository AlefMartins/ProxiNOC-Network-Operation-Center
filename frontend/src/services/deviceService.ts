import api from "./api"

// Tipos
export interface Device {
  id: number
  name: string
  ip: string
  port: number
  manufacturer: string
  model?: string
  description?: string
  sshEnabled: boolean
  telnetEnabled: boolean
  winboxEnabled: boolean
  status: "online" | "offline" | "maintenance" | "error"
  lastSeen?: Date
  latency: number
  createdAt: Date
  updatedAt: Date
}

export interface DeviceStatus {
  id: number
  name: string
  ip: string
  status: "online" | "offline" | "maintenance" | "error"
  latency: number
  lastSeen?: Date
  error?: string
}

export interface DeviceStats {
  total: number
  online: number
  offline: number
  maintenance: number
  byManufacturer: Array<{
    manufacturer: string
    count: number
  }>
}

export interface CommandResult {
  output: string
}

export interface CommandLog {
  id: number
  userId: number
  deviceId: number
  command: string
  output: string
  protocol: "ssh" | "telnet" | "winbox"
  timestamp: Date
  createdAt: Date
  updatedAt: Date
  User?: {
    id: number
    username: string
    fullName: string
  }
  Device?: {
    id: number
    name: string
    ip: string
  }
}

// Serviço de dispositivos
const deviceService = {
  // Listar todos os dispositivos
  async getAllDevices(): Promise<Device[]> {
    const response = await api.get<Device[]>("/devices")
    return response.data
  },

  // Buscar dispositivo por ID
  async getDeviceById(id: number): Promise<Device> {
    const response = await api.get<Device>(`/devices/${id}`)
    return response.data
  },

  // Criar dispositivo
  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await api.post<Device>("/devices", device)
    return response.data
  },

  // Atualizar dispositivo
  async updateDevice(id: number, device: Partial<Device>): Promise<Device> {
    const response = await api.put<Device>(`/devices/${id}`, device)
    return response.data
  },

  // Excluir dispositivo
  async deleteDevice(id: number): Promise<void> {
    await api.delete(`/devices/${id}`)
  },

  // Verificar status do dispositivo
  async checkDeviceStatus(id: number): Promise<DeviceStatus> {
    const response = await api.get<DeviceStatus>(`/devices/${id}/status`)
    return response.data
  },

  // Verificar status de todos os dispositivos
  async checkAllDevicesStatus(): Promise<DeviceStatus[]> {
    const response = await api.get<DeviceStatus[]>("/devices/status/all")
    return response.data
  },

  // Executar comando SSH
  async executeCommand(id: number, command: string): Promise<CommandResult> {
    const response = await api.post<CommandResult>(`/devices/${id}/command`, { command })
    return response.data
  },

  // Histórico de comandos
  async getCommandHistory(id: number): Promise<CommandLog[]> {
    const response = await api.get<CommandLog[]>(`/devices/${id}/commands`)
    return response.data
  },

  // Estatísticas dos dispositivos
  async getDeviceStats(): Promise<DeviceStats> {
    const response = await api.get<DeviceStats>("/devices/stats/summary")
    return response.data
  },
}

export default deviceService

