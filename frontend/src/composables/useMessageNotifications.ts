import type { DeepReadonly } from 'vue'
import { onScopeDispose, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuth } from '../states/auth.ts'
import { useChannels } from '../states/channels.ts'
import { useUsers } from '../states/users.ts'
import { useMessages } from '../states/messages.ts'
import { shouldNotify, useNotifications } from '../states/notifications.ts'
import type { Message } from '../types/message.ts'

export function useMessageNotifications() {
  const $q = useQuasar()
  const { profile } = useAuth()
  const channels = useChannels()
  const messages = useMessages()
  const { mode } = useNotifications()
  const cards = ref<
    { id: number; sender: string; content: string }[]
  >([])
  const dismissalTimers = new Map<number, ReturnType<typeof setTimeout>>()

  function dismiss(id: number) {
    clearTimeout(dismissalTimers.get(id))
    dismissalTimers.delete(id)
    cards.value = cards.value.filter(card => card.id !== id)
  }
  function clearCards() {
    dismissalTimers.forEach(clearTimeout)
    dismissalTimers.clear()
    cards.value = []
  }
  function show(message: DeepReadonly<Message>) {
    if (
      !shouldNotify(
        message,
        {
          userId: profile.value.id,
          status: profile.value.status,
          joined: channels.isJoined(message.channelId),
          visible: $q.appVisible
        },
        mode.value
      )
    )
      return
    dismiss(message.id)
    if (cards.value.length >= 3) dismiss(cards.value[0]!.id)
    cards.value = [
      ...cards.value,
      {
        id: message.id,
        sender:
          useUsers().getById(message.authorId)?.nickname ?? 'Unknown user',
        content:
          message.content.length > 160
            ? message.content.slice(0, 160) + '…'
            : message.content,
      }
    ].slice(-3)
    dismissalTimers.set(message.id, setTimeout(() => dismiss(message.id), 7000))
  }
  const unsubscribe = messages.onIncoming(message =>
    show(message)
  )
  watch([mode, () => profile.value.status], clearCards)
  onScopeDispose(() => {
    unsubscribe()
    clearCards()
  })

  return { cards, dismiss }
}
