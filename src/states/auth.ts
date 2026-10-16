import { computed, readonly, ref } from 'vue'
import type { Profile } from '../types/profile.ts'
import type { UserStatus } from '../types/member.ts'
import { mockProfile } from '../mock/users.ts'
import { useUsers } from './users.ts'
import { useDrafts } from './drafts.ts'

const profile = ref<Profile>(structuredClone(mockProfile))
const isLoggedIn = ref(false)

const { updateUser, getByNickname } = useUsers()

const fullName = computed(() =>
  `${profile.value.firstName} ${profile.value.lastName}`.trim()
)

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
  validateNickname(nickname)
  if (nickname !== profile.value.nickname) {
    profile.value = { ...profile.value, firstName: '', lastName: '', nickname }
  }
  profile.value.status = 'online'
  isLoggedIn.value = true
  syncDirectory()
}

function logout() {
  useDrafts().clear()
  profile.value.status = 'offline'
  isLoggedIn.value = false
  syncDirectory()
}

function validateNickname(nickname: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(nickname))
    throw new Error(
      'Use letters, numbers, underscores or hyphens for your nickname.'
    )
  const existing = getByNickname(nickname)
  if (existing && existing.id !== profile.value.id)
    throw new Error('This nickname is already taken.')
}

function updateProfile(changes: Partial<Omit<Profile, 'id'>>) {
  if (changes.nickname !== undefined) validateNickname(changes.nickname)
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
    fullName,
    initials,
    login,
    logout,
    updateProfile,
    setStatus
  }
}
