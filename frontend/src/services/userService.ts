import api from "./api"

// Defina um tipo User completo que inclui todas as propriedades necessárias
export interface User {
  id: number
  username: string
  email: string
  fullName: string
  isLdapUser: boolean
  isActive: boolean
  lastLogin?: string
  Groups?: {
    id: number
    name: string
    description?: string
    isLdapGroup?: boolean
  }[]
  groups?: {
    id: number
    name: string
    description?: string
    isLdapGroup?: boolean
  }[]
}

export interface Group {
  id: number
  name: string
}

// Tipos
export interface UserCreateData {
  username: string
  password: string
  email: string
  fullName: string
  isActive?: boolean
  groupIds?: number[]
}

export interface UserUpdateData {
  email?: string
  fullName?: string
  isActive?: boolean
  groupIds?: number[]
}

export interface PasswordChangeData {
  currentPassword?: string
  newPassword: string
}

// Serviço de usuários
const userService = {
  // Listar todos os usuários
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>("/users")
    // Garantir que todos os usuários tenham a propriedade groups
    return response.data.map((user) => ({
      ...user,
      groups: user.groups || [],
    }))
  },

  // Buscar usuários com paginação
  async getUsers(params = {}): Promise<{ users: User[]; total: number }> {
    const response = await api.get("/users", { params })
    return response.data
  },

  // Buscar usuário por ID
  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`)
    return response.data
  },

  // Criar usuário
  async createUser(userData: UserCreateData): Promise<User> {
    const response = await api.post<User>("/users", userData)
    return response.data
  },

  // Atualizar usuário
  async updateUser(id: number, userData: UserUpdateData): Promise<User> {
    try {
      const response = await api.put<User>(`/users/${id}`, userData)

      // Se houver grupos para atualizar e for um usuário LDAP
      if (userData.groupIds && response.data.isLdapUser) {
        // A sincronização com o AD é feita automaticamente pelo backend
        console.log("Grupos atualizados com sincronização AD")
      }

      return response.data
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      throw error
    }
  },

  // Excluir usuário
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  // Alterar senha
  async changePassword(id: number, passwordData: PasswordChangeData): Promise<void> {
    await api.post(`/users/${id}/change-password`, passwordData)
  },

  // Importar usuários do LDAP
  async importLdapUsers(
    usernames: string[],
    userGroups?: Record<string, number[]>,
  ): Promise<{ success: boolean; imported: number; message?: string }> {
    const response = await api.post("/ldap/import-users", { usernames, userGroups })
    return response.data
  },

  // Resetar senha
  async resetPassword(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/users/${userId}/reset-password`)
    return response.data
  },

  // Ativar/desativar usuário
  async activateUser(userId: number, isActive: boolean): Promise<User> {
    const response = await api.patch(`/users/${userId}/activate`, { isActive })
    return response.data
  },

  // Obter grupos de um usuário
  async getUserGroups(userId: number): Promise<{ id: number; name: string }[]> {
    const response = await api.get(`/users/${userId}/groups`)
    return response.data
  },

  // Atualizar grupos de um usuário
  async updateUserGroups(userId: number, groupIds: number[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put(`/users/${userId}/groups`, { groupIds })
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar grupos do usuário:", error)
      throw error
    }
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<User> {
    const response = await api.get("/users/me")
    return response.data
  },

  // Atualizar perfil do usuário atual
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put("/users/profile", userData)
    return response.data
  },

  // Obter grupos disponíveis para um usuário
  getAvailableGroups: async (userId: number): Promise<Group[]> => {
    const response = await api.get(`/users/${userId}/available-groups`)
    return response.data
  },
}

export default userService

