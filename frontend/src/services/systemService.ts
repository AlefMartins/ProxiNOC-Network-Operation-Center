import api from "./api"

interface SystemInfo {
  version: string
  uptime: string
  nodeVersion: string
  platform: string
  memory: {
    total: number
    free: number
    used: number
  }
  cpu: {
    model: string
    cores: number
    usage: number
  }
  disk: {
    total: number
    free: number
    used: number
  }
}

const systemService = {
  getSystemInfo: async (): Promise<SystemInfo> => {
    const response = await api.get("/system/info")
    return response.data
  },

  getSystemSettings: async () => {
    const response = await api.get("/system/settings")
    return response.data
  },

  updateSystemSettings: async (settings: any) => {
    const response = await api.put("/system/settings", settings)
    return response.data
  },

  getSystemStats: async () => {
    const response = await api.get("/system/stats")
    return response.data
  },

  restartSystem: async () => {
    const response = await api.post("/system/restart")
    return response.data
  },
}

export default systemService

