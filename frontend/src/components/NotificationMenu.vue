<template>
  <q-btn
    flat
    round
    dense
    aria-label="Message notification settings"
    class="notification-settings"
  >
    <q-icon
      :name="mode === 'nothing' ? 'notifications_off' : 'notifications_none'"
      size="30px"
    />
    <q-tooltip>Message notifications</q-tooltip>
    <q-menu dark class="notification-settings-menu">
      <div class="q-px-md q-pt-md text-weight-bold">Message notifications</div>
      <q-list padding style="min-width: 230px">
        <q-item
          v-for="option in options"
          :key="option.value"
          tag="label"
          clickable
        >
          <q-item-section avatar>
            <q-radio
              dark
              :model-value="mode"
              :val="option.value"
              @update:model-value="setMode(option.value)"
              :aria-label="option.label"
            />
          </q-item-section>
          <q-item-section>{{ option.label }}</q-item-section>
        </q-item>
        <q-separator dark spaced />
        <q-item
          clickable
          v-close-popup
          @click="running ? stopDemo() : startDemo()"
          :disable="!canDemo"
        >
          <q-item-section avatar
            ><q-icon name="chat_bubble_outline"
          /></q-item-section>
          <q-item-section
            >{{ running ? 'Stop message demo' : 'Start message demo' }}
            <q-item-label caption
              >3 messages to #general, 5 seconds apart</q-item-label
            >
          </q-item-section>
        </q-item>
        <div class="q-px-md q-pb-sm text-caption"
          >Demo cards also appear while viewing the app.</div
        >
      </q-list>
    </q-menu>
  </q-btn>
  <Teleport to="body">
    <div
      class="message-toast-stack"
      aria-live="polite"
      aria-label="Message notifications"
    >
      <article v-for="card in cards" :key="card.id" class="message-toast">
        <header class="message-toast-header">
          <q-avatar
            size="20px"
            color="primary"
            icon="forest"
            text-color="white"
          />
          <span>VPWA</span><small v-if="card.demo">Demo</small>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="close"
            aria-label="Dismiss notification"
            @click="dismiss(card.id)"
          />
        </header>
        <div class="message-toast-body">
          <q-avatar size="56px" class="message-toast-avatar">{{
            card.sender.slice(0, 1).toUpperCase()
          }}</q-avatar>
          <div
            ><strong>{{ card.sender }}</strong
            ><p><MentionText :text="card.content" /></p
          ></div>
        </div>
      </article>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotifications, type NotificationMode } from '@/states/notifications'
import MentionText from './MentionText.vue'
import { useMessageNotifications } from '@/composables/useMessageNotifications'
const { mode, setMode } = useNotifications()
const { cards, dismiss, running, canDemo, startDemo, stopDemo } =
  useMessageNotifications()
const options: { value: NotificationMode; label: string }[] = [
  { value: 'all', label: 'All messages' },
  { value: 'mentions', label: 'Only @mentions' },
  { value: 'nothing', label: 'Nothing' }
]
</script>

<style lang="scss">
.notification-settings {
  margin-left: auto;
  color: $text-link;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}
.notification-settings-menu {
  background: $surface-input;
  color: $text-body;
}
.message-toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 7000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}
.message-toast {
  pointer-events: auto;
  background: $surface-input;
  color: $text-heading;
  border: 1px solid rgba($accent, 0.3);
  border-radius: 5px;
  box-shadow: 0 8px 28px #0005;
  padding: 8px 12px 16px;
}
.message-toast-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  small {
    color: $text-muted;
    font-size: 11px;
  }
  .q-btn {
    margin-left: auto;
    color: $text-muted;
  }
}
.message-toast-body {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 0 0;
  > div:last-child {
    min-width: 0;
  }
  strong {
    font-size: 16px;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  p {
    color: $text-body;
    margin: 3px 0 0;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
}
.message-toast-avatar {
  background: $secondary;
  color: $text-heading;
  flex-shrink: 0;
}
</style>
