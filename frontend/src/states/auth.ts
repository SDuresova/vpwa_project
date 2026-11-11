import { computed, readonly, ref } from 'vue'
import type { Profile } from '../types/profile'
import type { UserStatus } from '../types/member'
import { api } from '../services/api'
import { useDrafts } from './drafts'

const empty = (): Profile => ({ id: 0, firstName: '', lastName: '', nickname: '', email: '', status: 'offline' })
const profile = ref<Profile>(empty())
const isLoggedIn = ref(false)
let restoring: Promise<void> | undefined
let restored = false
const fullName = computed(() => `${profile.value.firstName} ${profile.value.lastName}`.trim())
const initials = computed(() => ((profile.value.firstName[0] || profile.value.nickname[0] || '?') + (profile.value.lastName[0] || '')).toUpperCase())

function clear() {
  sessionStorage.removeItem('vpwa-token')
  profile.value = empty()
  isLoggedIn.value = false
  useDrafts().clear()
}
window.addEventListener('vpwa-unauthorized', clear)

async function restore() {
  if (restored) return
  if (!restoring) restoring = (async () => {
    if (sessionStorage.getItem('vpwa-token')) {
      const { data } = await api.get<Profile>('/account/profile')
      profile.value = data
      isLoggedIn.value = true
    }
    restored = true
  })().finally(() => { restoring = undefined })
  return restoring
}
async function login(nickname: string, password: string) {
  const { data } = await api.post('/auth/login', { nickname, password })
  sessionStorage.setItem('vpwa-token', data.token)
  profile.value = data.user
  isLoggedIn.value = true
  restored = true
}
async function logout() {
  await api.post('/account/logout')
  clear()
}
async function updateProfile(changes: Partial<Omit<Profile, 'id'>>) {
  const { data } = await api.patch<Profile>('/account/profile', { ...profile.value, ...changes })
  profile.value = data
}
const setStatus = (status: UserStatus) => updateProfile({ status })
export function useAuth() {
  return { profile: readonly(profile), isLoggedIn: readonly(isLoggedIn), fullName, initials, login, logout, restore, updateProfile, setStatus }
}
