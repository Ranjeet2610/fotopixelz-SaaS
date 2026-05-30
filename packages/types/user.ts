export interface UserDTO {
  id: string
  email: string
  role: 'CLIENT' | 'EDITOR' | 'QA' | 'ADMIN' | 'SUPER_ADMIN'
}

