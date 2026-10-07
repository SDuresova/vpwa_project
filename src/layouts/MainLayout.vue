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
          >{{ channelName
          }}<span class="channel-description"
            >A tiny space to grow.</span
          ></q-toolbar-title
        >
        <q-btn
          flat
          round
          icon="group"
          aria-label="Toggle members"
          @click="rightDrawerOpen = !rightDrawerOpen"
          ><q-tooltip>Members</q-tooltip></q-btn
        >
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      :breakpoint="900"
      class="channel-drawer"
    >
      <div class="sidebar-stack">
        <div class="workspace-heading"
          ><q-avatar
            rounded
            color="primary"
            text-color="white"
            icon="forest"
            size="38px"
          /><div
            ><strong>VPWA</strong><span>Your conversation space</span></div
          ></div
        >
        <nav class="channel-navigation" aria-label="Channels">
          <q-btn
            flat
            no-caps
            align="left"
            :icon="invitationsOpen ? 'drafts' : 'mail_outline'"
            label="Invitations"
            class="invitations-toggle full-width"
            :aria-expanded="invitationsOpen"
            aria-controls="invitation-list"
            @click="invitationsOpen = !invitationsOpen"
          />
          <q-slide-transition>
            <div v-show="invitationsOpen" id="invitation-list">
              <q-item
                v-for="ch in invitations"
                :key="ch.name"
                class="channel-item channel-invitation-row"
                style="border: 0; box-shadow: none"
              >
                <q-item-section avatar
                  ><q-avatar
                    size="32px"
                    color="secondary"
                    text-color="white"
                    class="invitation-avatar"
                    >{{ channelInitials(ch.name) }}</q-avatar
                  ></q-item-section
                ><q-item-section
                  >{{ ch.name
                  }}<q-item-label caption
                    >New invitation</q-item-label
                  ></q-item-section
                >
              </q-item>
              <p v-if="!invitations.length" class="q-px-md q-py-sm"
                >No invitations yet.</p
              >
            </div>
          </q-slide-transition>
          <div class="section-heading"
            >CHANNELS<q-btn
              flat
              round
              dense
              size="sm"
              icon="add"
              aria-label="Create channel"
              @click="createDialog = true"
          /></div>
          <q-item
            v-for="ch in joinedChannels"
            :key="ch.name"
            clickable
            :to="`/channels/${ch.name}`"
            active-class="channel-active"
            class="channel-item"
            @click="closeMobileChannels"
          >
            <q-item-section avatar
              ><q-icon :name="ch.type === 'private' ? 'lock' : 'tag'"
            /></q-item-section>
            <q-item-section>{{ ch.name }}</q-item-section>
            <q-item-section side v-if="ch.unread"
              ><q-badge rounded color="primary">{{
                ch.unread
              }}</q-badge></q-item-section
            >
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="more_vert"
                :aria-label="`Actions for ${ch.name}`"
                @click.prevent.stop
              >
                <q-menu dark
                  ><q-list dense>
                    <q-item clickable v-close-popup @click="removeChannel(ch)"
                      ><q-item-section>Leave channel</q-item-section></q-item
                    >
                    <q-item
                      v-if="ch.isAdmin"
                      clickable
                      v-close-popup
                      @click="removeChannel(ch)"
                      ><q-item-section>Delete channel</q-item-section></q-item
                    >
                  </q-list></q-menu
                >
              </q-btn>
            </q-item-section>
          </q-item>
        </nav>
        <!-- This stays at the bottom while the channel list scrolls. -->
        <div class="profile-bar">
          <button
            class="profile-trigger"
            @click="openProfile"
            aria-label="Open my profile"
          >
            <span class="avatar-wrap"
              ><q-avatar size="38px" color="primary" text-color="white">{{
                initials
              }}</q-avatar
              ><span
                class="presence-dot"
                :style="{ background: statusColors[profile.status] }"
            /></span>
            <span class="profile-summary"
              ><strong>{{ profile.nickname }}</strong
              ><span>{{
                profile.status === 'DND' ? 'Do not disturb' : profile.status
              }}</span></span
            >
          </button>
          <q-btn
            flat
            round
            dense
            icon="settings"
            aria-label="Edit my profile"
            @click="openProfile"
          />
          <q-btn
            flat
            round
            dense
            icon="logout"
            aria-label="Log out"
            to="/login"
          />
        </div>
      </div>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      show-if-above
      :width="240"
      :breakpoint="1100"
      class="members-drawer"
    >
      <div class="section-heading q-mt-sm"
        >MEMBERS — {{ members.length
        }}<q-btn
          flat
          dense
          round
          icon="close"
          aria-label="Close members"
          @click="rightDrawerOpen = false"
      /></div>
      <q-item v-for="member in members" :key="member.nick" class="member-row">
        <q-item-section avatar
          ><span class="avatar-wrap"
            ><q-avatar size="34px" color="secondary" text-color="white">{{
              member.nick[0].toUpperCase()
            }}</q-avatar
            ><span
              class="presence-dot"
              :style="{ background: statusColors[member.status] }" /></span
        ></q-item-section>
        <q-item-section
          ><q-item-label
            >{{ member.nick }}
            <q-icon
              v-if="member.isAdmin"
              name="star"
              color="accent"
              size="14px" /></q-item-label
          ><q-item-label caption>{{
            member.status
          }}</q-item-label></q-item-section
        >
      </q-item>
      <div v-if="!members.length" class="q-pa-md">No members to display.</div>
    </q-drawer>

    <q-page-container><router-view /></q-page-container>

    <q-dialog v-model="profileDialog">
      <q-card class="profile-card">
        <div class="profile-banner"
          ><q-btn
            flat
            round
            icon="close"
            aria-label="Close profile"
            v-close-popup
        /></div>
        <q-card-section>
          <q-avatar
            class="profile-large-avatar"
            size="64px"
            color="primary"
            text-color="white"
            >{{ initials }}</q-avatar
          >
          <h2 class="profile-name">{{ fullName || profile.nickname }}</h2
          ><p class="muted">@{{ profile.nickname }}</p>
          <q-form @submit="saveProfile" class="q-gutter-md">
            <div class="name-fields"
              ><q-input
                dark
                outlined
                dense
                v-model.trim="draft.firstName"
                label="First name"
                :rules="required" /><q-input
                dark
                outlined
                dense
                v-model.trim="draft.surname"
                label="Surname"
                :rules="required"
            /></div>
            <q-input
              dark
              outlined
              dense
              v-model.trim="draft.nickname"
              label="Nickname"
              :rules="required"
            />
            <q-input
              dark
              outlined
              dense
              v-model.trim="draft.email"
              label="Email"
              type="email"
              :rules="required"
            />
            <q-select
              dark
              outlined
              dense
              v-model="draft.status"
              :options="['online', 'DND', 'offline']"
              label="Status"
            />
            <div class="row justify-end q-gutter-sm"
              ><q-btn flat label="Cancel" v-close-popup /><q-btn
                color="primary"
                label="Save profile"
                type="submit"
                no-caps
            /></div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="createDialog">
      <q-card class="profile-card q-pa-lg">
        <h2 class="profile-name q-mt-none">Create a channel</h2>
        <q-form @submit="addChannel" class="q-gutter-md">
          <q-input
            dark
            outlined
            v-model.trim="newChannelName"
            label="Channel name"
            :rules="[
              v =>
                /^[a-z0-9-]+$/.test(v) ||
                'Use lowercase letters, numbers and hyphens',
              v =>
                !channels.some(ch => ch.name === v) ||
                'This channel already exists'
            ]"
          />
          <q-option-group
            dark
            v-model="newChannelType"
            inline
            :options="[
              { label: 'Public', value: 'public' },
              { label: 'Private', value: 'private' }
            ]"
          />
          <div class="row justify-end"
            ><q-btn flat label="Cancel" v-close-popup /><q-btn
              color="primary"
              label="Create"
              type="submit"
          /></div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { profile } from '@/state/profile'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)
const createDialog = ref(false)
const profileDialog = ref(false)
const newChannelName = ref('')
const newChannelType = ref('public')
const draft = reactive({})
const required = [value => !!value?.trim() || 'This field is required']
const statusColors = { online: '#23a55a', DND: '#f23f42', offline: '#b5c1ad' }
const fullName = computed(() =>
  `${profile.firstName} ${profile.surname}`.trim()
)
const initials = computed(
  () =>
    (profile.firstName[0] || profile.nickname[0] || '?').toUpperCase() +
    (profile.surname[0] || '').toUpperCase()
)
const channels = ref([
  { name: 'project-invitation', type: 'private', invited: true },
  {
    name: 'general',
    type: 'public',
    unread: 3,
    members: [
      { nick: 'alice', status: 'online' },
      { nick: 'bob', status: 'DND' },
      { nick: 'cyprian', status: 'offline', isAdmin: true }
    ]
  },
  {
    name: 'random',
    type: 'public',
    members: [
      { nick: 'david', status: 'online' },
      { nick: 'fabio', status: 'DND' }
    ]
  },
  {
    name: 'vpwa-team',
    type: 'private',
    unread: 1,
    isAdmin: true,
    members: [{ nick: 'ida', status: 'online' }]
  }
])
const channelName = computed(() => route.params.name || 'general')
const activeChannel = computed(() =>
  channels.value.find(ch => ch.name === channelName.value)
)
const invitations = computed(() => channels.value.filter(ch => ch.invited))
const invitationsOpen = ref(false)
function channelInitials(name) {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}
const joinedChannels = computed(() => channels.value.filter(ch => !ch.invited))
const members = computed(() =>
  activeChannel.value
    ? [
        {
          nick: profile.nickname,
          status: profile.status,
          isAdmin: activeChannel.value.isAdmin
        },
        ...(activeChannel.value.members || [])
      ]
    : []
)
function openProfile() {
  Object.assign(draft, profile)
  profileDialog.value = true
}
function saveProfile() {
  Object.assign(profile, draft)
  profileDialog.value = false
}
function closeMobileChannels() {
  if ($q.screen.width <= 900) leftDrawerOpen.value = false
}
function removeChannel(channel) {
  channels.value = channels.value.filter(ch => ch !== channel)
  if (channelName.value === channel.name)
    router.push(`/channels/${joinedChannels.value[0]?.name || 'general'}`)
}
function addChannel() {
  channels.value.push({
    name: newChannelName.value,
    type: newChannelType.value,
    isAdmin: true,
    members: []
  })
  router.push(`/channels/${newChannelName.value}`)
  newChannelName.value = ''
  newChannelType.value = 'public'
  createDialog.value = false
  closeMobileChannels()
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
  .channel-invitation-row {
    background: rgba($primary, 0.15);
    border: none;
    box-shadow: none;
    .q-item__section--avatar {
      min-width: 44px;
    }
  }
  .invitation-avatar {
    font-size: 12px;
    font-weight: 700;
  }
  .invitations-toggle {
    min-height: 40px;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 4px;
    color: $text-body;
  }
  .q-item__label--caption {
    color: $text-muted;
    font-size: 11px;
  }
  .sidebar-note {
    color: $text-muted;
    font-size: 12px;
    line-height: 1.7;
    padding: 20px 12px;
    opacity: 0.65;
  }
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
  .member-row {
    padding: 10px 18px;
    font-size: 13px;
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
.profile-card {
  width: 440px;
  max-width: 94vw;
  background: $dark;
  color: $text-body;
  border: 1px solid rgba($accent, 0.2);
  border-radius: 12px;
}
.profile-banner {
  height: 88px;
  background: linear-gradient(120deg, $primary, $secondary);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 8px;
}
.profile-large-avatar {
  margin-top: -48px;
  border: 5px solid $dark;
}
.profile-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}
.muted {
  color: $text-muted;
}
.name-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 420px) {
  .name-fields {
    grid-template-columns: 1fr;
  }
}
</style>
