import { ref } from 'vue'
import { api } from '../services/api'
import type { Channel } from '../types/channel'
import type { Member } from '../types/member'
import type { Message } from '../types/message'
import type { CommandResult } from '../types/command'

export const channelData = ref<Channel[]>([])
export const invitationData = ref<Channel[]>([])
export const userData = ref<Member[]>([])
export const messageData = ref<Message[]>([])
export const syncError = ref('')
const incoming = new Set<(message: Message) => void>()
let generation = 0
let requestId = 0
let appliedRequest = 0
let loaded = false

export function resetChat() {
  generation++
  loaded = false
  channelData.value = []
  invitationData.value = []
  userData.value = []
  messageData.value = []
  syncError.value = ''
}
export async function refreshChat() {
  const currentGeneration = generation
  const id = ++requestId
  const { data } = await api.get<{ channels: Channel[]; invitations: Channel[]; users: Member[]; messages: Message[] }>('/chat')
  if (generation !== currentGeneration || id < appliedRequest) return
  appliedRequest = id
  const known = new Set(messageData.value.map(m => m.id))
  const oldChannels = new Set(channelData.value.map(c => c.id))
  channelData.value = data.channels
  invitationData.value = data.invitations
  userData.value = data.users
  messageData.value = data.messages
  if (loaded) data.messages.filter(m => oldChannels.has(m.channelId) && !known.has(m.id)).forEach(m => incoming.forEach(fn => fn(m)))
  loaded = true
  syncError.value = ''
}
export async function act(action: string, channelId?: number, args: string[] = []) {
  const { data } = await api.post<CommandResult & { banned?: boolean; votes?: number }>('/chat/action', { action, channelId, args })
  await refreshChat()
  return data
}
export const onIncoming = (fn: (message: Message) => void) => {
  incoming.add(fn)
  return () => { incoming.delete(fn) }
}
