<template>
  <!-- This stays at the bottom while the channel list scrolls. -->
  <div class="profile-bar">
    <button class="profile-trigger" aria-label="Open my profile" @click="dialogOpen = true">
      <span class="avatar-wrap"
        ><q-avatar size="38px" color="primary" text-color="white">{{ initials }}</q-avatar
        ><span class="presence-dot" :style="{ background: statusColors[profile.status] }"
      /></span>
      <span class="profile-summary"
        ><strong>{{ profile.nickname }}</strong
        ><span>{{ profile.status === 'dnd' ? 'Do not disturb' : profile.status }}</span></span
      >
    </button>
    <q-btn flat round dense icon="settings" aria-label="Edit my profile" @click="dialogOpen = true" />
    <q-btn flat round dense icon="logout" aria-label="Log out" @click="logOut" />

    <ProfileDialog v-model="dialogOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/states/auth'
import { statusColors } from '@/constants/status'
import ProfileDialog from '@/components/ProfileDialog.vue'

const router = useRouter()
const { profile, initials, logout } = useAuth()

const dialogOpen = ref(false)

function logOut() {
  logout()
  router.push('/login')
}
</script>

<style lang="scss">
.chat-shell {
  .profile-bar {
    display: flex;
    align-items: center;
    padding: 12px 8px;
    gap: 4px;
    background: $dark-page;
    border-top: 1px solid rgba($text-muted, 0.1);
  }
  .profile-trigger {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: inherit;
    padding: 4px;
    cursor: pointer;
    text-align: left;
    border-radius: 6px;
    &:hover {
      background: rgba($accent, 0.1);
    }
  }
  .profile-summary {
    min-width: 0;
    strong,
    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    strong {
      font-size: 13px;
    }
    span {
      font-size: 11px;
      color: $text-muted;
    }
  }
}
</style>