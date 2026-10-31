import type { UserStatus } from './member.ts'

export interface Profile {
  id: number
  email: string
  firstName: string
  lastName: string
  nickname: string
  status: UserStatus
}
