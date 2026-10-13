import { readonly, ref } from 'vue'
import type { Message } from '../types/message.ts'
import { mockMessages } from '../mock/messages.ts'
import { useAuth } from './auth.ts'
import { useUsers } from './users.ts'
import { useChannels } from './channels.ts'

const messages = ref<Record<number, Message[]>>(structuredClone(mockMessages))

const { profile } = useAuth()
const { getByNickname } = useUsers()

function forChannel(channelId: number) {
  if (!useChannels().isJoined(channelId)) return readonly([] as Message[])
  return readonly(messages.value[channelId] ?? [])
}

function parseMentions(content: string): number[] {
  const ids = new Set<number>() // array which can contains unique value only 1 -> prevent duplicates

  for (const match of content.matchAll(/(?:^|\s)@([a-zA-Z0-9_-]+)/g)) {
    const user = getByNickname(match[1]!)
    if (user) ids.add(user.id) // if user found add him to mentioned ids
  }

  return [...ids]
}

function send(channelId: number, content: string) {
  if (!useChannels().isJoined(channelId))
    throw new Error('Join this channel before sending messages.')
  if (!content.trim()) throw new Error('Enter a message.')
  const message: Message = {
    id: Math.max(
      Date.now(),
      ...Object.values(messages.value)
        .flat()
        .map(message => message.id + 1)
    ),
    channelId,
    authorId: profile.value.id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    mentionedUsers: parseMentions(content)
  }
  if (messages.value[channelId] === undefined) {
    // no msg
    messages.value[channelId] = [] // create array
  }

  messages.value[channelId].push(message) // push msg to array
  return readonly(message)
}

function removeChannel(channelId: number) {
  delete messages.value[channelId]
}

export function useMessages() {
  return {
    forChannel,
    send,
    removeChannel
  }
}
