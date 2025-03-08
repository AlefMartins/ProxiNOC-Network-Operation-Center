import api from "./api"

export interface Group {
  id: number
  name: string
  description?: string
  isLdapGroup?: boolean
  groupType?: string
  permissions?: Record<string, string[]>
  members?: number
}

export interface GroupCreateData {
  name: string
  description?: string
  groupType?: string
  permissions?: Record<string, string[]>
}

export interface GroupUpdateData {
  name?: string
  description?: string
  groupType?: string
  permissions?: Record<string, string[]>
}

const groupService = {
  // Obter todos os grupos
  getAllGroups: async (): Promise<Group[]> => {
    const response = await api.get("/groups")
    return response.data
  },

  // Obter grupo por ID
  getGroupById: async (id: number): Promise<Group> => {
    const response = await api.get(`/groups/${id}`)
    return response.data
  },

  // Criar grupo
  createGroup: async (groupData: GroupCreateData): Promise<Group> => {
    const response = await api.post("/groups", groupData)
    return response.data
  },

  // Atualizar grupo
  updateGroup: async (id: number, groupData: GroupUpdateData): Promise<Group> => {
    const response = await api.put(`/groups/${id}`, groupData)
    return response.data
  },

  // Excluir grupo
  deleteGroup: async (id: number): Promise<void> => {
    try {
      await api.delete(`/groups/${id}`)
    } catch (error) {
      // Repassar o erro para ser tratado pelo componente
      throw error
    }
  },

  // Obter usuários de um grupo
  getGroupUsers: async (id: number): Promise<any[]> => {
    const response = await api.get(`/groups/${id}/users`)
    return response.data
  },

  // Atualizar usuários de um grupo
  updateGroupUsers: async (id: number, userIds: number[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/groups/${id}/users`, { userIds })
    return response.data
  },

  // Obter grupos LDAP
  getLdapGroups: async (): Promise<Group[]> => {
    const response = await api.get("/ldap/groups")
    return response.data
  },
}

export default groupService

