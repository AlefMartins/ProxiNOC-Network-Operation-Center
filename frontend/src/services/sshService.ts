import api from "./api"

const sshService = {
  executeCommand: async (deviceId: number, command: string) => {
    const response = await api.post(`/devices/${deviceId}/command`, { command })
    return response.data
  },

  connectSSH: async (deviceId: number) => {
    const response = await api.post(`/devices/${deviceId}/connect/ssh`)
    return response.data
  },

  connectTelnet: async (deviceId: number) => {
    const response = await api.post(`/devices/${deviceId}/connect/telnet`)
    return response.data
  },

  disconnect: async (deviceId: number) => {
    const response = await api.post(`/devices/${deviceId}/disconnect`)
    return response.data
  },
}

export default sshService

