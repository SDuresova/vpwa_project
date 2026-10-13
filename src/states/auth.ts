import { computed, readonly, ref } from 'vue'
import type { Profile } from '../types/profile'
import type { UserStatus } from '../types/member'
import { mockProfile } from '../mock/users'
import { useUsers } from './users'

const profile = ref<Profile>(structuredClone(mockProfile))
const isLoggedIn = ref(true)

const { updateUser } = useUsers()

const initials = computed(() => {
  const { firstName, lastName, nickname } = profile.value
  const first = firstName[0] ?? nickname[0] ?? '?'
  const last = lastName[0] ?? ''
  return (first + last).toUpperCase()
})

// sync data 
function syncDirectory() {
  updateUser(profile.value.id, {
    nickname: profile.value.nickname,
    status: profile.value.status
  })
}

function login(nickname: string) {
  if (nickname !== profile.value.nickname) {
    profile.value = { ...profile.value, firstName: '', lastName: '', nickname }
  }
  profile.value.status = 'online'
  isLoggedIn.value = true
  syncDirectory()
}

function logout() {
  profile.value.status = 'offline'
  isLoggedIn.value = false
  syncDirectory()
}

function updateProfile(changes: Partial<Omit<Profile, 'id'>>) {
  Object.assign(profile.value, changes)
  syncDirectory()
}

function setStatus(status: UserStatus) {
  profile.value.status = status
  syncDirectory()
}

export function useAuth() {
  return {
    profile: readonly(profile),
    isLoggedIn: readonly(isLoggedIn),
    initials,
    login,
    logout,
    updateProfile,
    setStatus
  }
}