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
        ><p>{{
          canSend
            ? 'This is the beginning of your conversation.'
            : 'Join this channel to read and send messages. Type /join channelName below.'
        }}</p></div
      >
      <div v-if="currentMessages.length" class="date-divider"
        ><span>Today</span></div
      >
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
      <transition name="suggestions">
        <div
          v-if="showSuggestions"
          id="command-options"
          class="command-options"
          role="listbox"
          :aria-label="mentionQuery !== null ? 'Channel members' : 'Commands'"
        >
          <button
            v-for="(command, index) in suggestions"
            :id="`command-${index}`"
            :key="command.name"
            type="button"
            role="option"
            :aria-selected="selected === index"
            :class="{ selected: selected === index }"
            @mousedown.prevent
            @click="selectCommand(command)"
          >
            <span
              ><strong
                >{{ command.mention ? '@' : '/' }}{{ command.name }}</strong
              >
              {{ command.args }}</span
            >
            <small>{{ command.description }}</small>
          </button>
        </div>
      </transition>
      <p
        v-if="feedback"
        class="command-feedback"
        :class="{ error: hasError }"
        role="status"
        >{{ feedback }}</p
      >
      <q-form @submit="sendMessage" class="composer">
        <q-icon name="tag" size="22px" class="q-ml-md" />
        <q-input
          ref="composerInput"
          dark
          borderless
          v-model="draft"
          :placeholder="
            canSend
              ? `Message #${channelName} or type / for commands`
              : 'Type /join channelName to join a channel'
          "
          :aria-label="`Message ${channelName}`"
          class="col q-px-md"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="showSuggestions"
          aria-controls="command-options"
          :aria-activedescendant="
            showSuggestions ? `command-${selected}` : undefined
          "
          @keydown="onKeydown"
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
      <div class="composer-hint">{{
        activeCommand
          ? `Usage: /${activeCommand.name} ${activeCommand.args} · ${activeCommand.description}`
          : 'Type / for commands · @nickname to mention someone'
      }}</div>
    </div>
    <q-dialog v-model="helpOpen"
      ><q-card class="command-dialog q-pa-lg"
        ><h2>Commands</h2
        ><p v-for="command in commandDefinitions" :key="command.name"
          ><strong>/{{ command.name }} {{ command.args }}</strong
          ><br />{{ command.description }}</p
        ><q-btn flat label="Close" v-close-popup /></q-card
    ></q-dialog>
    <q-dialog v-model="membersOpen"
      ><q-card class="command-dialog q-pa-lg"
        ><h2>Members of #{{ channelName }}</h2
        ><p v-for="member in channelMembers" :key="member.nick"
          >@{{ member.nick }} · {{ member.status
          }}{{ member.isAdmin ? ' · admin' : '' }}</p
        ><q-btn flat label="Close" v-close-popup /></q-card
    ></q-dialog>
    <q-dialog
      :model-value="!!pendingDelete"
      @update:model-value="
        value => {
          if (!value) pendingDelete = null
        }
      "
      ><q-card class="command-dialog q-pa-lg"
        ><h2>Delete #{{ pendingDelete?.name }}?</h2
        ><p
          >You are the administrator. This removes the channel and its local
          message history.</p
        ><q-btn flat label="Cancel" @click="pendingDelete = null" /><q-btn
          color="negative"
          label="Delete channel"
          @click="confirmDelete" /></q-card
    ></q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { profile } from '@/state/profile'
import {
  channels,
  isJoined,
  leaveChannel,
  commandDefinitions,
  executeCommand
} from '@/state/channels'
const route = useRoute()
const router = useRouter()
const channelName = computed(() => route.params.name || 'general')
const draft = ref('')
const composerInput = ref(null)
const selected = ref(0)
const dismissed = ref(false)
const feedback = ref('')
const hasError = ref(false)
const helpOpen = ref(false)
const membersOpen = ref(false)
const pendingDelete = ref(null)
const activeChannel = computed(() =>
  channels.value.find(channel => channel.name === channelName.value)
)
const canSend = computed(() => isJoined(activeChannel.value))
const activeCommand = computed(() =>
  commandDefinitions.find(command =>
    draft.value.startsWith(`/${command.name} `)
  )
)
const channelMembers = computed(() =>
  canSend.value
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
const mentionQuery = computed(() =>
  draft.value.startsWith('/')
    ? null
    : (draft.value.match(/(?:^|\s)@([^\s@]*)$/)?.[1] ?? null)
)
const suggestions = computed(() =>
  mentionQuery.value !== null
    ? channelMembers.value
        .filter(member =>
          member.nick.toLowerCase().startsWith(mentionQuery.value.toLowerCase())
        )
        .map(member => ({
          name: member.nick,
          description: member.status,
          mention: true
        }))
    : commandDefinitions.filter(command =>
        command.name.startsWith(draft.value.slice(1).toLowerCase())
      )
)
const showSuggestions = computed(
  () =>
    !dismissed.value &&
    (/^\/\S*$/.test(draft.value) || mentionQuery.value !== null) &&
    suggestions.value.length > 0
)
watch(draft, () => {
  selected.value = 0
  dismissed.value = false
})
function selectCommand(command) {
  draft.value = command.mention
    ? draft.value.replace(/@[^\s@]*$/, `@${command.name} `)
    : `/${command.name} `
  composerInput.value?.focus()
}
function onKeydown(event) {
  if (event.isComposing || !showSuggestions.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
  }
  if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault()
    selected.value =
      (selected.value +
        (event.key === 'ArrowDown' ? 1 : -1) +
        suggestions.value.length) %
      suggestions.value.length
    nextTick(() =>
      document
        .getElementById(`command-${selected.value}`)
        ?.scrollIntoView({ block: 'nearest' })
    )
  }
  if (['Enter', 'Tab'].includes(event.key)) {
    event.preventDefault()
    selectCommand(suggestions.value[selected.value])
  }
}
function confirmDelete() {
  const channel = pendingDelete.value
  if (!channel) return
  leaveChannel(channel)
  delete messages[channel.name]
  pendingDelete.value = null
  draft.value = ''
  router.push(`/channels/${channels.value.find(isJoined)?.name || 'general'}`)
}
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
const currentMessages = computed(() =>
  canSend.value ? messages[channelName.value] || [] : []
)
watch(
  () => channels.value.map(channel => channel.name),
  names => {
    for (const name of Object.keys(messages)) {
      if (!names.includes(name)) delete messages[name]
    }
  },
  { flush: 'sync' }
)
const author = message => (message.own ? profile.nickname : message.author)
watch(channelName, () => {
  draft.value = ''
  feedback.value = ''
  membersOpen.value = false
})
async function sendMessage() {
  if (!draft.value.trim()) return
  hasError.value = false
  feedback.value = ''
  if (draft.value.trim().startsWith('/')) {
    try {
      const result = executeCommand(
        draft.value.trim(),
        channelName.value,
        profile.nickname
      )
      if (result.confirmDelete) {
        pendingDelete.value = result.confirmDelete
        return
      }
      if (result.help) helpOpen.value = true
      if (result.members) membersOpen.value = true
      if (result.navigate) await router.push(`/channels/${result.navigate}`)
      feedback.value = result.message || ''
      draft.value = ''
    } catch (error) {
      hasError.value = true
      feedback.value = error.message
    }
    return
  }
  if (!canSend.value) {
    hasError.value = true
    feedback.value = 'Join this channel before sending messages.'
    return
  }
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
  position: relative;
  flex-shrink: 0;
  padding: 12px 24px 10px;
}
.command-options {
  position: absolute;
  bottom: 100%;
  left: 24px;
  right: 24px;
  max-height: min(320px, 45vh);
  overflow-y: auto;
  z-index: 10;
  border: 1px solid rgba($accent, 0.3);
  border-radius: 10px;
  background: $surface-input;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.2);
  padding: 6px;
  button {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    border-radius: 6px;
    padding: 10px 12px;
    background: transparent;
    color: $text-body;
    cursor: pointer;
  }
  button.selected,
  button:hover {
    background: rgba($accent, 0.18);
  }
  small {
    display: block;
    color: $text-muted;
    margin-top: 3px;
  }
}
.command-feedback {
  margin: 0 0 8px;
  color: $text-link;
  overflow-wrap: anywhere;
}
.command-feedback.error {
  color: #ffb4ab;
}
.command-dialog {
  width: 480px;
  max-width: 94vw;
  background: $dark;
  color: $text-body;
  h2 {
    font-size: 20px;
    margin: 0 0 16px;
  }
}
.suggestions-enter-active,
.suggestions-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (prefers-reduced-motion: reduce) {
  .suggestions-enter-active,
  .suggestions-leave-active {
    transition: none;
  }
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
