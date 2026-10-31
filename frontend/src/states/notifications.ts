import type { DeepReadonly } from 'vue'
import { readonly, ref } from 'vue'
import type { Message } from '../types/message.ts'
import type { UserStatus } from '../types/member.ts'

export type NotificationMode = 'all' | 'mentions' | 'nothing'
const storageKey = 'vpwa.notification-mode'
function loadMode(): NotificationMode {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved === 'mentions' || saved === 'nothing') return saved
  } catch {
    /* Storage may be unavailable. */
  }
  return 'all'
}
const mode = ref<NotificationMode>(loadMode())

export function shouldNotify(
  message: DeepReadonly<Message>,
  context: {
    userId: number
    status: UserStatus
    joined: boolean
    visible: boolean
  },
  preference: NotificationMode
) {
  return (
    context.joined &&
    !context.visible &&
    context.status === 'online' &&
    message.authorId !== context.userId &&
    preference !== 'nothing' &&
    (preference === 'all' || message.mentionedUsers.includes(context.userId))
  )
}

export function useNotifications() {
  return {
    mode: readonly(mode),
    setMode(value: NotificationMode) {
      mode.value = value
      try {
        localStorage.setItem(storageKey, value)
      } catch {
        /* Session fallback. */
      }
    }
  }
}
