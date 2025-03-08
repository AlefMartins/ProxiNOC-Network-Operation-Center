import api from "./api"

// Tipos
export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  isLdapUser: boolean
  groups: Group[]
}

export interface Group {
  id: number
  name: string
  description: string
  permissions: Record<string, string[]>
}

export interface AuthResponse {
  user: User
  token: string
}

// Serviço de autenticação
const authService = {
  // Login unificado
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials)

    // Armazenar token e usuário
    localStorage.setItem("token", response.data.token)
    localStorage.setItem("user", JSON.stringify(response.data.user))

    return response.data
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      // Remover token e usuário mesmo se a requisição falhar
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  // Verificar token
  async verifyToken(): Promise<User | null> {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return null
      }

      const response = await api.get<{ user: User }>("/auth/verify")

      // Atualizar usuário armazenado
      localStorage.setItem("user", JSON.stringify(response.data.user))

      return response.data.user
    } catch (error) {
      console.error("Erro ao verificar token:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      return null
    }
  },

  // Obter usuário atual
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user")

    if (!userStr) {
      return null
    }

    try {
      return JSON.parse(userStr) as User
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error)
      return null
    }
  },

  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token")
  },

  // Verificar se o usuário tem permissão
  hasPermission(resource: string, action: string): boolean {
    const user = this.getCurrentUser()

    if (!user || !user.groups || user.groups.length === 0) {
      return false
    }

    return user.groups.some((group) => {
      const permissions = group.permissions

      if (!permissions) return false

      return permissions[resource] && permissions[resource].includes(action)
    })
  },
}

export default authService

