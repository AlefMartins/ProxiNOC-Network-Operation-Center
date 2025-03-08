import api from "./api"

export interface LdapConfig {
  enabled: boolean
  server: string
  port: number
  baseDn: string
  bindUser: string
  bindPassword?: string
  userFilter: string
  userLoginAttribute: string
  userNameAttribute: string
  userEmailAttribute: string
  groupFilter: string
  groupNameAttribute: string
  groupMemberAttribute: string
  groupDescriptionAttribute: string
  syncInterval: number
  sslEnabled: boolean
  lastSync?: string
}

const ldapService = {
  // Verificar se LDAP está habilitado
  isLdapEnabled: async (): Promise<{ enabled: boolean }> => {
    const response = await api.get("/ldap/enabled")
    return response.data
  },

  // Obter configuração LDAP
  getLdapConfig: async (): Promise<LdapConfig> => {
    const response = await api.get("/ldap/config")
    return response.data
  },

  // Atualizar configuração LDAP
  updateLdapConfig: async (config: Partial<LdapConfig>): Promise<LdapConfig> => {
    const response = await api.put("/ldap/config", config)
    return response.data
  },

  // Testar conexão LDAP
  testLdapConnection: async (timeout?: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/ldap/test", { timeout })
    return response.data
  },

  // Sincronizar usuários LDAP
  syncLdapUsers: async (): Promise<{ success: boolean; added: number; updated: number; groups: number; message?: string }> => {
    const response = await api.post("/ldap/sync")
    return response.data
  },

  // Obter usuários LDAP disponíveis para importação
  getAvailableLdapUsers: async (): Promise<Array<{ username: string; fullName: string; email: string }>> => {
    const response = await api.get("/ldap/available-users")
    return response.data
  },

  // Obter grupos LDAP disponíveis para importação
  getAvailableLdapGroups: async (): Promise<Array<{ name: string; description: string; members: number }>> => {
    const response = await api.get("/ldap/available-groups")
    return response.data
  },

  // Importar grupos LDAP
  importGroups: async (
    groupNames: string[],
    groupTypes?: Record<string, string>,
  ): Promise<{ success: boolean; imported: number; message?: string }> => {
    const response = await api.post("/ldap/import-groups", { groupNames, groupTypes })
    return response.data
  },

  // Alterar senha de usuário LDAP
  changePassword: async (
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/ldap/change-password", { username, oldPassword, newPassword })
    return response.data
  },
}

export default ldapService

