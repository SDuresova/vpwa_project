import { readonly } from 'vue'
import { api } from '../services/api'
import { messageData, refreshChat, onIncoming } from './chat'
import { useChannels } from './channels'
export function useMessages() {
  return {
    forChannel: (id: number) => readonly(useChannels().isJoined(id) ? messageData.value.filter(m => m.channelId === id) : []),
    onIncoming,
    send: async (channelId: number, content: string) => {
      const result = await api.post('/chat/messages', { channelId, content })
      await refreshChat()
      return result.data
    },
    removeChannel: (id: number) => { messageData.value = messageData.value.filter(m => m.channelId !== id) }
  }
}
