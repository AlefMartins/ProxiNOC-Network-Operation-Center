export interface User {
    id: number
    username: string
    email?: string
    fullName?: string
    isLdapUser: boolean
    isActive: boolean
    Groups?: Array<{
      id: number
      name: string
      description?: string
      isLdapGroup?: boolean
    }>
  }
  
  export interface UserCreateData {
    username: string
    password?: string
    email?: string
    fullName?: string
    isActive?: boolean
    groupIds?: number[]
  }
  
  export interface UserUpdateData {
    email?: string
    fullName?: string
    isActive?: boolean
    groupIds?: number[]
  }
  
  export interface UserFormData extends UserCreateData {
    confirmPassword?: string
  }
  
  