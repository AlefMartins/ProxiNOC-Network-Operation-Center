export interface LdapUser {
  username: string
  fullName?: string
  email?: string
  dn?: string
  groups?: number[] // IDs dos grupos no sistema que correspondem aos grupos do AD
  ldapGroups?: string[] // Nomes dos grupos no AD
}

export interface LdapGroup {
  name: string
  description?: string
  dn?: string
  members?: number // Alterado para garantir que sempre é um número
}

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

