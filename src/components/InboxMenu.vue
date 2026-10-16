<template>
  <q-btn
    flat
    round
    icon="inbox"
    :aria-label="hasUnreadInvitations ? 'Inbox, unread invitation' : 'Inbox'"
    :aria-expanded="open"
    aria-haspopup="true"
    aria-controls="notification-inbox"
  >
    <q-badge
      v-if="hasUnreadInvitations"
      rounded
      floating
      color="positive"
      class="inbox-dot"
      aria-hidden="true"
    />
    <q-tooltip>Inbox</q-tooltip>

    <q-menu
      v-model="open"
      dark
      anchor="bottom right"
      self="top right"
      :offset="[0, 10]"
      class="notification-inbox"
      @show="markInvitationsRead"
    >
      <section id="notification-inbox" aria-label="Notifications">
        <div class="inbox-heading">
          <h2>Inbox</h2>
          <span>{{ invitations.length }} pending</span>
        </div>

        <q-list v-if="invitations.length" class="q-pa-sm">
          <q-item
            v-for="channel in invitations"
            :key="channel.name"
            class="inbox-invitation"
          >
            <q-item-section avatar top>
              <q-avatar color="secondary" text-color="white" icon="mail_outline" size="36px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">Channel invitation</q-item-label>
              <q-item-label class="inbox-copy">
                You've been invited to join <strong>{{ channel.name }}</strong>.
              </q-item-label>
              <q-item-label caption>
                {{ channel.type === 'private' ? 'Private channel' : 'Public channel' }}
              </q-item-label>
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  label="Join"
                  :aria-label="`Join ${channel.name}`"
                  @click="join(channel)"
                />
                <q-btn
                  no-caps
                  flat
                  label="Decline"
                  :aria-label="`Decline ${channel.name}`"
                  @click="declineInvitation(channel.id)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="inbox-empty" role="status">
          <q-icon name="done_all" size="32px" />
          <p>You're all caught up.</p>
          <span>New notifications will appear here.</span>
        </div>
      </section>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChannels } from '@/states/channels'
import { useAttempt } from '@/composables/useAttempt'
import type { Channel } from '@/types/channel'

const emit = defineEmits<{ navigate: [] }>()

const router = useRouter()
const attempt = useAttempt()
const {
  invitations,
  hasUnreadInvitations,
  markInvitationsRead,
  acceptInvitation,
  declineInvitation
} = useChannels()

const open = ref(false)

function join(channel: Pick<Channel, 'id' | 'name'>) {
  attempt(() => {
    acceptInvitation(channel.id)
    open.value = false
    router.push('/channels/' + channel.name)
    emit('navigate')
  })
}
</script>

<style lang="scss">
// QMenu is rendered outside .chat-shell, so its styles live at the top level.
.inbox-dot {
  min-width: 8px;
  min-height: 8px;
  padding: 0;
  top: 6px;
  right: 6px;
  border: 2px solid $dark;
  box-sizing: content-box;
}
.notification-inbox {
  width: 360px;
  max-width: calc(100vw - 24px);
  background: $dark;
  color: $text-body;
  border: 1px solid rgba($text-muted, 0.18);
  border-radius: 10px;

  .inbox-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba($text-muted, 0.15);
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }
    span {
      color: $text-muted;
      font-size: 12px;
    }
  }
  .inbox-invitation {
    background: rgba($accent, 0.1);
    border-radius: 6px;
    padding: 16px 12px;
  }
  .inbox-copy {
    line-height: 1.5 !important;
    overflow-wrap: anywhere;
  }
  .q-item__label--caption {
    color: $text-muted;
  }
  .inbox-empty {
    padding: 32px 16px;
    text-align: center;
    color: $text-muted;
    p {
      color: $text-heading;
      margin: 12px 0 4px;
    }
    span {
      font-size: 12px;
    }
  }
}
</style>