import { readonly } from 'vue'
import { userData } from './chat'
import type { Member } from '../types/member'
export function useUsers() {
  return {
    users: readonly(userData),
    getById: (id: number) => userData.value.find(u => u.id === id),
    getByNickname: (name: string) => userData.value.find(u => u.nickname.toLowerCase() === name.toLowerCase()),
    updateUser: (id: number, changes: Partial<Omit<Member, 'id'>>) => {
      const user = userData.value.find(u => u.id === id)
      if (user) Object.assign(user, changes)
    }
  }
}
