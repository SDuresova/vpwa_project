import { reactive } from 'vue'

// Session-only, personal drafts. Switching channels does not discard input.
const drafts = reactive(new Map<string, string>())

export function useDrafts() {
  return {
    get: (channelName: string) => drafts.get(channelName) ?? '',
    set(channelName: string, text: string) {
      if (text) drafts.set(channelName, text)
      else drafts.delete(channelName)
    },
    remove: (channelName: string) => drafts.delete(channelName),
    clear: () => drafts.clear()
  }
}
