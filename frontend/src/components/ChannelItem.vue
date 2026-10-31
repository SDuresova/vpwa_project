<template>
  <q-item
    clickable
    :to="`/channels/${channel.name}`"
    active-class="channel-active"
    class="channel-item"
    :class="{ 'channel-pinned': channel.pinned }"
    @click="emit('navigate')"
  >
    <q-item-section avatar>
      <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ channel.name }}</q-item-label>
      <q-item-label
        v-if="draft"
        caption
        class="channel-draft ellipsis"
        :title="'Draft: ' + draft"
      >
        <span>Draft:</span> {{ draft }}
      </q-item-label>
    </q-item-section>

    <q-item-section v-if="channel.pinned" side>
      <q-icon name="push_pin" size="16px" aria-label="Pinned channel">
        <q-tooltip>Pinned channel</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section v-if="channel.unreadCount" side>
      <q-badge rounded color="primary">{{ channel.unreadCount }}</q-badge>
    </q-item-section>

    <q-item-section side>
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="more_vert"
        :aria-label="`Actions for ${channel.name}`"
        @click.prevent.stop
      >
        <q-menu dark>
          <q-list dense>
            <q-item clickable v-close-popup @click.prevent.stop="togglePin(channel.id)">
              <q-item-section>{{ channel.pinned ? 'Unpin channel' : 'Pin channel' }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="removeChannel">
              <q-item-section>Leave channel</q-item-section>
            </q-item>
            <q-item v-if="isAdmin(channel.id)" clickable v-close-popup @click="removeChannel">
              <q-item-section>Delete channel</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed, type DeepReadonly } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useChannels } from '@/states/channels'
import { useDrafts } from '@/states/drafts'
import { useActiveChannel } from '@/composables/useActiveChannel'
import { useAttempt } from '@/composables/useAttempt'
import type { Channel } from '@/types/channel'

const props = defineProps<{ channel: DeepReadonly<Channel> }>()
const emit = defineEmits<{ navigate: [] }>()

const $q = useQuasar()
const router = useRouter()
const attempt = useAttempt()
const drafts = useDrafts()
const { channelName } = useActiveChannel()
const { joinedChannels, isAdmin, togglePin, remove, leave } = useChannels()

const draft = computed(() => {
  if (props.channel.name === channelName.value) return ''
  return drafts.get(props.channel.name).trim() ? drafts.get(props.channel.name) : ''
})

function removeChannel() {
  const { id, name } = props.channel
  const admin = isAdmin(id)

  const finish = () =>
    attempt(() => {
      admin ? remove(id) : leave(id)
      if (channelName.value === name)
        router.push('/channels/' + (joinedChannels.value[0]?.name || 'general'))
    })

  if (!admin) return finish()

  $q.dialog({
    title: `Delete #${name}?`,
    message: 'As administrator, leaving deletes this channel and its message history.',
    cancel: true,
    persistent: true
  }).onOk(finish)
}
</script>

<style lang="scss">
.chat-shell {
  .channel-item {
    min-height: 40px;
    border-radius: 6px;
    margin-bottom: 4px;
    padding: 8px 12px;
    .q-item__section--avatar {
      min-width: 30px;
    }
  }
  .channel-active {
    background: rgba($accent, 0.16);
    color: $text-link;
  }
  .channel-draft {
    max-width: 100%;
    span {
      color: $text-link;
      font-weight: 600;
    }
  }
  .channel-pinned {
    background: rgba($accent, 0.12);
    color: $text-link;
    font-weight: 600;
    .q-icon {
      color: $text-link;
    }
    &.channel-active {
      background: rgba($accent, 0.24);
    }
  }
}
</style>