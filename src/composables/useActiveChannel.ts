import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChannels } from '@/states/channels'

// select channel by acctual url address
export function useActiveChannel() {
  const route = useRoute()
  const { getByName } = useChannels()

  const channelName = computed(() => String(route.params.name || 'general'))
  const activeChannel = computed(() => getByName(channelName.value))

  return { channelName, activeChannel }
}