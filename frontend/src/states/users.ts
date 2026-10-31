import { readonly, ref } from 'vue'
import type { Member } from '../types/member.ts'
import { mockUsers } from '../mock/users.ts'

// all members stored here
const users = ref<Member[]>(structuredClone(mockUsers))

function getById(id: number) {
  const user = users.value.find(u => u.id === id)
  return user ? readonly(user) : undefined
}

function getByNickname(nickname: string) {
  const user = users.value.find(
    u => u.nickname.toLowerCase() === nickname.toLowerCase()
  )
  return user ? readonly(user) : undefined
}

function updateUser(id: number, changes: Partial<Omit<Member, 'id'>>) {
  // send member without id and with any attribute you want
  const user = users.value.find(u => u.id === id) // finds user by id
  if (user) Object.assign(user, changes) // asign changes
}

export function useUsers() {
  return {
    users: readonly(users),
    getById,
    getByNickname,
    updateUser
  }
}
