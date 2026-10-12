import { readonly, ref } from 'vue'
import type { Message } from '../types/message'
import { mockMessages } from '../mock/messages'
import { useAuth } from './auth'
import { useUsers } from './users'


const messages = ref<Record<number, Message[]>>(structuredClone(mockMessages))

const { profile } = useAuth()
const { getByNickname } = useUsers()

function forChannel(channelId: number) {
  return readonly(messages.value[channelId] ?? [])
}

function parseMentions(content: string): number[] {
    const ids = new Set<number>() // array which can contains unique value only 1 -> prevent duplicates

    for (const word of content.split(/\s+/)) {   
    if (!word.startsWith('@')) continue // no mention

    const user = getByNickname(word.slice(1))   // slice @ away
    if (user) ids.add(user.id) // if user found add him to mentioned ids
    }

    return [...ids]                               
}

function send(channelId: number, content: string) {
    const message: Message = {
        id: Date.now(),
        channelId,
        authorId: profile.value.id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        mentionedUsers: parseMentions(content)
    }
    if (messages.value[channelId] === undefined) {  // no msg
        messages.value[channelId] = []                 // create array
    }

    messages.value[channelId].push(message)          // push msg to array
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