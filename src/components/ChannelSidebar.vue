<template>
  <div class="sidebar-stack">
    <div class="workspace-heading"
      ><q-avatar rounded color="primary" text-color="white" icon="forest" size="38px" /><div
        ><strong>VPWA</strong><span>Your conversation space</span></div
      ></div
    >

    <nav class="channel-navigation" aria-label="Channels">
      <div class="section-heading"
        >CHANNELS<q-btn
          flat
          round
          dense
          size="sm"
          icon="add"
          aria-label="Create channel"
          @click="createOpen = true"
      /></div>
      <ChannelItem
        v-for="channel in joinedChannels"
        :key="channel.name"
        :channel="channel"
        @navigate="emit('navigate')"
      />
    </nav>

    <ProfileBar />

    <CreateChannelDialog v-model="createOpen" @created="emit('navigate')" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChannels } from '@/states/channels'
import ChannelItem from './ChannelItem.vue'
import ProfileBar from './ProfileBar.vue'
import CreateChannelDialog from './CreateChannelDialog.vue'

const emit = defineEmits<{ navigate: [] }>()

const { joinedChannels } = useChannels()
const createOpen = ref(false)
</script>

<style lang="scss">
.chat-shell {
  .sidebar-stack {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .workspace-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 22px 18px;
    border-bottom: 1px solid rgba($text-muted, 0.12);
    strong {
      display: block;
      color: $text-heading;
      letter-spacing: 2px;
    }
    span {
      font-size: 11px;
      color: $text-muted;
    }
  }
  .channel-navigation {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px;
  }
}
</style>