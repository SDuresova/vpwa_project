import type { DeepReadonly } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
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
    { id: number; sender: string; content: string; demo: boolean }[]
  >([])
  const running = ref(false)
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const dismissalTimers = new Map<number, ReturnType<typeof setTimeout>>()
  const demoIds = new Set<number>()
  const canDemo = computed(() => {
    const channel = channels.getByName('general')
    return (
      !!channel &&
      channels.isJoined(channel.id) &&
      profile.value.status !== 'offline' &&
      channels
        .membersOf(channel.id)
        .some(member => member.id !== profile.value.id)
    )
  })

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
  function show(message: DeepReadonly<Message>, preview = false) {
    if (
      !shouldNotify(
        message,
        {
          userId: profile.value.id,
          status: profile.value.status,
          joined: channels.isJoined(message.channelId),
          visible: preview ? false : $q.appVisible
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
        demo: preview
      }
    ].slice(-3)
    dismissalTimers.set(message.id, setTimeout(() => dismiss(message.id), 7000))
  }
  function stopDemo() {
    timers.forEach(clearTimeout)
    timers.clear()
    demoIds.clear()
    running.value = false
  }
  const unsubscribe = messages.onIncoming(message =>
    show(message, demoIds.has(message.id))
  )
  watch([mode, () => profile.value.status], clearCards)
  watch(canDemo, allowed => {
    if (!allowed) stopDemo()
  })
  onScopeDispose(() => {
    unsubscribe()
    stopDemo()
    clearCards()
  })

  function startDemo() {
    if (!canDemo.value) return
    stopDemo()
    running.value = true
    for (let index = 0; index < 3; index++) {
      const timer = setTimeout(
        () => {
          timers.delete(timer)
          const channel = channels.getByName('general')
          if (!channel || !canDemo.value) {
            stopDemo()
            return
          }
          const senders = channels
            .membersOf(channel.id)
            .filter(member => member.id !== profile.value.id)
          const sender = senders[index % senders.length]!
          const id = Math.max(
            Date.now(),
            ...messages.forChannel(channel.id).map(message => message.id + 1)
          )
          const content = [
            'Hey everyone! How is your day going?',
            'I just finished working on the project. Anyone around?',
            `Hey @${profile.value.nickname}, what do you think of the new notifications?`
          ][index]!
          demoIds.add(id)
          messages.receive({
            id,
            channelId: channel.id,
            authorId: sender.id,
            content,
            createdAt: new Date().toISOString(),
            mentionedUsers: index === 2 ? [profile.value.id] : []
          })
          demoIds.delete(id)
          if (index === 2) running.value = false
        },
        (index + 1) * 5000
      )
      timers.add(timer)
    }
  }
  return { cards, dismiss, running, canDemo, startDemo, stopDemo }
}
