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
    description: string
    groupType: string
    permissions: Record<string, string[]>
  }
  
  export interface GroupUpdateData {
    name?: string
    description?: string
    groupType?: string
    permissions?: Record<string, string[]>
  }
  
  