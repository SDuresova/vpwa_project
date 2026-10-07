<template>
  <q-page
    class="conversation-page"
    :style-fn="
      (offset, height) => ({ height: `${height - offset}px`, minHeight: '0px' })
    "
  >
    <div class="message-history" aria-label="Messages">
      <div class="channel-welcome"
        ><q-avatar size="64px" icon="tag" /><h1
          >Welcome to #{{ channelName }}</h1
        ><p>This is the beginning of your conversation.</p></div
      >
      <div class="date-divider"><span>Today</span></div>
      <article
        v-for="message in currentMessages"
        :key="message.id"
        class="message-row"
      >
        <q-avatar
          size="38px"
          :color="message.own ? 'primary' : 'secondary'"
          text-color="white"
          >{{ author(message)[0].toUpperCase() }}</q-avatar
        >
        <div class="message-content"
          ><div class="message-meta"
            ><strong>{{ author(message) }}</strong
            ><time>{{ message.time }}</time
            ><span v-if="message.own" class="you-label">you</span></div
          ><p>{{ message.text }}</p></div
        >
      </article>
    </div>
    <div class="composer-area">
      <q-form @submit="sendMessage" class="composer">
        <q-icon name="tag" size="22px" class="q-ml-md" />
        <q-input
          dark
          borderless
          v-model="draft"
          :placeholder="`Message #${channelName}`"
          :aria-label="`Message ${channelName}`"
          class="col q-px-md"
        />
        <q-btn
          flat
          round
          icon="send"
          type="submit"
          aria-label="Send message"
          :disable="!draft.trim()"
          class="q-mr-sm"
        />
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { profile } from '@/state/profile'
const route = useRoute()
const channelName = computed(() => route.params.name || 'general')
const draft = ref('')
// Local sample messages only; these reset when the page is refreshed.
const messages = reactive({
  general: [
    {
      id: 1,
      author: 'alice',
      text: 'Hey everyone! Welcome to our little corner of the internet.',
      time: '14:02'
    },
    { id: 2, own: true, text: 'Happy to be here! 🌿', time: '14:05' },
    {
      id: 3,
      author: 'ed',
      text: 'A fresh space for ideas, questions and everything in between.',
      time: '14:06'
    }
  ],
  random: [
    {
      id: 4,
      author: 'david',
      text: 'What is everyone working on today?',
      time: '14:10'
    }
  ],
  'vpwa-team': [
    {
      id: 5,
      author: 'ida',
      text: 'Let’s use this channel to plan our project.',
      time: '14:12'
    }
  ]
})
const currentMessages = computed(() => messages[channelName.value] || [])
const author = message => (message.own ? profile.nickname : message.author)
watch(channelName, () => {
  draft.value = ''
})
async function sendMessage() {
  if (!draft.value.trim()) return
  const channel = channelName.value
  messages[channel] ||= []
  messages[channel].push({
    id: Date.now(),
    own: true,
    text: draft.value.trim(),
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  })
  draft.value = ''
  await nextTick()
  document.querySelector('.message-history')?.scrollTo({
    top: document.querySelector('.message-history').scrollHeight,
    behavior: 'smooth'
  })
}
</script>

<style scoped lang="scss">
.conversation-page {
  display: flex;
  flex-direction: column;
  background: $dark;
  color: $text-body;
}
.message-history {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 32px 0 12px;
}
.channel-welcome {
  padding: 20px 28px;
  .q-avatar {
    background: rgba($accent, 0.12);
    color: $text-link;
  }
  h1 {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
    margin: 18px 0 8px;
    color: $text-heading;
    overflow-wrap: anywhere;
  }
  p {
    color: $text-muted;
    font-size: 13px;
  }
}
.date-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 28px;
  color: $text-muted;
  font-size: 11px;
  &::before,
  &::after {
    content: '';
    height: 1px;
    flex: 1;
    background: rgba($text-muted, 0.14);
  }
}
.message-row {
  display: flex;
  gap: 14px;
  padding: 12px 28px;
  &:hover {
    background: rgba($dark-page, 0.2);
  }
}
.message-content {
  min-width: 0;
  p {
    margin: 4px 0 0;
    line-height: 1.6;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    font-size: 14px;
  }
}
.message-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  strong {
    color: $text-heading;
    overflow-wrap: anywhere;
  }
  time {
    font-size: 11px;
    color: $text-muted;
  }
}
.you-label {
  font-size: 10px;
  color: $text-link;
}
.composer-area {
  flex-shrink: 0;
  padding: 12px 24px 10px;
}
.composer {
  display: flex;
  align-items: center;
  background: $surface-input;
  border: 1px solid rgba($accent, 0.18);
  border-radius: 10px;
  color: $text-link;
}
.composer-hint {
  font-size: 10px;
  color: $text-muted;
  margin: 8px 4px 0;
}
@media (max-width: 600px) {
  .channel-welcome {
    padding: 12px 16px;
    h1 {
      font-size: 23px;
    }
  }
  .message-row {
    padding: 10px 16px;
    gap: 10px;
  }
  .composer-area {
    padding: 10px 12px;
  }
}
</style>
