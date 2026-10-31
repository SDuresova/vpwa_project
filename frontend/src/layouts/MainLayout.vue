<template>
  <q-layout view="hHh Lpr lFf" class="chat-shell">
    <q-header class="chat-header">
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="menu"
          aria-label="Toggle channels"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-icon
          :name="activeChannel?.type === 'private' ? 'lock' : 'tag'"
          class="q-ml-sm"
          size="24px"
        />
        <q-toolbar-title class="channel-title"
          >{{ channelName }}<span class="channel-description">A tiny space to grow.</span></q-toolbar-title
        >
        <q-btn
          flat
          round
          icon="group"
          aria-label="Toggle members"
          @click="rightDrawerOpen = !rightDrawerOpen"
        >
          <q-tooltip>Members</q-tooltip>
        </q-btn>
        <InboxMenu @navigate="closeMobileChannels" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      :breakpoint="900"
      class="channel-drawer"
    >
      <ChannelSidebar @navigate="closeMobileChannels" />
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      show-if-above
      :width="240"
      :breakpoint="1100"
      class="members-drawer"
    >
      <MembersList @close="rightDrawerOpen = false" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useChannels } from '@/states/channels'
import { useActiveChannel } from '@/composables/useActiveChannel'
import InboxMenu from '@/components/InboxMenu.vue'
import ChannelSidebar from '@/components/ChannelSidebar.vue'
import MembersList from '@/components/MembersList.vue'

const $q = useQuasar()
const { markRead } = useChannels()
const { channelName, activeChannel } = useActiveChannel()

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

watch(
  () => activeChannel.value?.id,
  id => id !== undefined && markRead(id),
  { immediate: true }
)

function closeMobileChannels() {
  if ($q.screen.width <= 900) leftDrawerOpen.value = false
}
</script>

<style lang="scss">
.chat-shell {
  background: $dark;
  color: $text-body;
  .chat-header {
    background: $dark;
    border-bottom: 1px solid rgba($text-muted, 0.12);
  }
  .channel-title {
    font-size: 17px;
    font-weight: 700;
  }
  .channel-description {
    font-size: 12px;
    font-weight: 400;
    color: $text-muted;
    margin-left: 20px;
  }
  .channel-drawer {
    background: $surface-input;
    color: $text-body;
  }
  .members-drawer {
    background: $surface-input;
    color: $text-body;
    border-left: 1px solid rgba($text-muted, 0.08);
  }

  // Zdieľané medzi sidebarom a zoznamom členov
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 12px 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: $text-muted;
  }
  .q-item__label--caption {
    color: $text-muted;
    font-size: 11px;
  }
  .avatar-wrap {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
  }
  .presence-dot {
    position: absolute;
    width: 11px;
    height: 11px;
    border: 2px solid $surface-input;
    border-radius: 50%;
    right: -1px;
    bottom: -1px;
  }
  button:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
  @media (max-width: 700px) {
    .channel-description {
      display: none;
    }
  }
}

// Zdieľané medzi ProfileDialog a CreateChannelDialog
.profile-card {
  width: 440px;
  max-width: 94vw;
  background: $dark;
  color: $text-body;
  border: 1px solid rgba($accent, 0.2);
  border-radius: 12px;
}
.profile-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}
</style>