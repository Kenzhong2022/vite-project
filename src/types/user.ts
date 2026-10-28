// src/types/user.ts
export interface User {
  id: number
  name: string
  email: string
}

export type UserRole = 'admin' | 'editor' | 'viewer'