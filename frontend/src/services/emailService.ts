import api from "./api"

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password?: string
  fromEmail: string
  fromName: string
  enabled: boolean
}

export interface TestEmailResult {
  success: boolean
  message: string
  messageId?: string
}

const emailService = {
  // Obter configuração de email
  getEmailConfig: async (): Promise<EmailConfig> => {
    try {
      // Removido o prefixo /api pois ele já deve estar configurado na instância do axios
      const response = await api.get("/email/config")
      return response.data
    } catch (error) {
      console.error("Erro ao obter configuração de email:", error)
      throw error
    }
  },

  // Atualizar configuração de email
  updateEmailConfig: async (config: EmailConfig): Promise<EmailConfig> => {
    try {
      const response = await api.put("/email/config", config)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar configuração de email:", error)
      throw error
    }
  },

  // Testar configuração de email
  testEmail: async (config: EmailConfig): Promise<TestEmailResult> => {
    try {
      const response = await api.post("/email/test", config)
      return response.data
    } catch (error) {
      console.error("Erro ao testar configuração de email:", error)
      throw error
    }
  },
}

export default emailService

