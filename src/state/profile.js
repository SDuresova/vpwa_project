import { reactive } from 'vue'

// Shared prototype state. Passwords are never stored here.
export const profile = reactive({
  firstName: 'Demo',
  surname: 'User',
  nickname: 'jozko',
  email: '',
  status: 'online'
})

export function setProfile(details) {
  Object.assign(profile, details)
}

export function loginPreview(nickname) {
  if (nickname !== profile.nickname) {
    setProfile({ firstName: '', surname: '', email: '', nickname })
  }
  profile.status = 'online'
}
