import api from "./api"

interface ChangePasswordRequest {
  newPassword: string
}

interface ChangePasswordResponse {
  success: boolean
  message: string
}

const passwordService = {
  /**
   * Altera a senha do usuário logado
   * @param newPassword Nova senha
   * @returns Resultado da operação
   */
  async changePassword(newPassword: string): Promise<ChangePasswordResponse> {
    try {
      console.log("Enviando requisição para alterar senha")
      const response = await api.post<ChangePasswordResponse>("/password/change", {
        newPassword,
      })
      console.log("Resposta da requisição:", response.data)

      return response.data
    } catch (error: any) {
      console.error("Erro na requisição de alteração de senha:", error)
      if (error.response && error.response.data) {
        return error.response.data
      }

      return {
        success: false,
        message: "Erro ao alterar senha",
      }
    }
  },

  /**
   * Valida a complexidade da senha
   * @param password Senha a ser validada
   * @returns Resultado da validação
   */
  validatePasswordComplexity(password: string): { valid: boolean; message: string } {
    // Verificar tamanho mínimo
    if (password.length < 8) {
      return {
        valid: false,
        message: "A senha deve ter pelo menos 8 caracteres",
      }
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um número",
      }
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra maiúscula",
      }
    }

    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra minúscula",
      }
    }

    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um caractere especial",
      }
    }

    return {
      valid: true,
      message: "Senha válida",
    }
  },
}

export default passwordService

