<template>
  <div class="section-heading q-mt-sm"
    >MEMBERS — {{ members.length
    }}<q-btn flat dense round icon="close" aria-label="Close members" @click="emit('close')"
  /></div>

  <q-item v-for="member in members" :key="member.nickname" class="member-row">
    <q-item-section avatar>
      <span class="avatar-wrap"
        ><q-avatar size="34px" color="secondary" text-color="white">{{
          member.nickname[0].toUpperCase()
        }}</q-avatar
        ><span class="presence-dot" :style="{ background: statusColors[member.status] }"
      /></span>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        {{ member.nickname }}
        <q-icon v-if="member.isAdmin" name="star" color="accent" size="14px" />
      </q-item-label>
      <q-item-label caption>{{ member.status }}</q-item-label>
    </q-item-section>
  </q-item>

  <div v-if="!members.length" class="q-pa-md">No members to display.</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChannels } from '@/states/channels'
import { useActiveChannel } from '@/composables/useActiveChannel'
import { statusColors } from '@/constants/status'

const emit = defineEmits<{ close: [] }>()

const { membersOf } = useChannels()
const { activeChannel } = useActiveChannel()

const members = computed(() => {
  const channel = activeChannel.value
  if (!channel) return []
  return membersOf(channel.id).map(m => ({ ...m, isAdmin: m.id === channel.adminId }))
})
</script>

<style lang="scss">
.chat-shell {
  .member-row {
    padding: 10px 18px;
    font-size: 13px;
  }
}
</style>