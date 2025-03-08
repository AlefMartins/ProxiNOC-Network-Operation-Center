import api from "./api"

// Tipos
export interface AuditLog {
  id: number
  userId: number
  username: string
  action: string
  target: string
  details: string
  ip: string
  timestamp: Date
  createdAt: Date
  updatedAt: Date
  User?: {
    id: number
    username: string
    fullName: string
  }
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

export interface AuditLogResponse {
  total: number
  page: number
  limit: number
  pages: number
  logs: AuditLog[]
}

export interface CommandLogResponse {
  total: number
  page: number
  limit: number
  pages: number
  logs: CommandLog[]
}

export interface AuditLogFilter {
  startDate?: string
  endDate?: string
  username?: string
  action?: string
  target?: string
  page?: number
  limit?: number
}

export interface CommandLogFilter {
  startDate?: string
  endDate?: string
  username?: string
  deviceId?: number
  protocol?: string
  command?: string
  page?: number
  limit?: number
}

export interface ExportOptions {
  startDate?: string
  endDate?: string
  username?: string
  action?: string
  target?: string
  format: "json" | "csv" | "xlsx" | "pdf"
}

// Serviço de auditoria
const auditService = {
  // Listar logs de auditoria
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLog[]> {
    const response = await api.get<AuditLogResponse>("/audit", { params: filter })
    return response.data.logs // Retorna apenas os logs
  },

  // Obter ações disponíveis para filtro
  async getAuditActions(): Promise<string[]> {
    const response = await api.get<string[]>("/audit/actions")
    return response.data
  },

  // Obter alvos disponíveis para filtro
  async getAuditTargets(): Promise<string[]> {
    const response = await api.get<string[]>("/audit/targets")
    return response.data
  },

  // Listar logs de comandos
  async getCommandLogs(filter: CommandLogFilter = {}): Promise<CommandLogResponse> {
    const response = await api.get<CommandLogResponse>("/audit/commands", { params: filter })
    return response.data
  },

  // Exportar logs de auditoria
  async exportAuditLogs(options: ExportOptions): Promise<Blob> {
    const response = await api.get("/audit/export", {
      params: options,
      responseType: "blob",
    })

    return response.data
  },
}

export default auditService

