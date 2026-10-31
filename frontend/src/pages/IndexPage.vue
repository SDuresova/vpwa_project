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
        :class="{
          'message-mentioned': message.mentionedUsers.includes(profile.id)
        }"
      >
        <q-avatar
          size="38px"
          :color="message.authorId === profile.id ? 'primary' : 'secondary'"
          text-color="white"
          >{{ author(message)[0].toUpperCase() }}</q-avatar
        >
        <div class="message-content"
          ><div class="message-meta"
            ><strong>{{ author(message) }}</strong
            ><time>{{
              new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            }}</time
            ><span v-if="message.authorId === profile.id" class="you-label"
              >you</span
            ></div
          ><p><MentionText :text="message.content" /></p
        ></div>
      </article>
    </div>
    <div class="composer-area">
      <TypingIndicator
        :channel-id="activeChannel?.id"
        :members="channelMembers"
        :current-user-id="profile.id"
        :enabled="canSend && profile.status !== 'offline'"
      />
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
        ><p v-for="member in channelMembers" :key="member.nickname"
          >@{{ member.nickname }} · {{ member.status
          }}{{ member.isAdmin ? ' · admin' : '' }}</p
        ><q-btn flat label="Close" v-close-popup /></q-card
    ></q-dialog>
    <q-dialog
      :model-value="!!pendingDelete"
      @update:model-value="
        value => {
          if (!value) pendingDeleteId = null
        }
      "
      ><q-card class="command-dialog q-pa-lg"
        ><h2>Delete #{{ pendingDelete?.name }}?</h2
        ><p
          >You are the administrator. This removes the channel and its local
          message history.</p
        ><q-btn flat label="Cancel" @click="pendingDeleteId = null" /><q-btn
          color="negative"
          label="Delete channel"
          @click="confirmDelete" /></q-card
    ></q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QInput } from 'quasar'
import TypingIndicator from '@/components/TypingIndicator.vue'
import MentionText from '@/components/MentionText.vue'
import { useAuth } from '@/states/auth'
import { useChannels } from '@/states/channels'
import { useMessages } from '@/states/messages'
import { useUsers } from '@/states/users'
import { useDrafts } from '@/states/drafts'
import { commandDefinitions as definitions } from '@/commands/definitions'
import { argumentLabel } from '@/commands/parser'
import { executeCommand } from '@/commands/execute'
import type { Message } from '@/types/message'

interface Suggestion {
  name: string
  args?: string
  description: string
  mention?: boolean
}
const { profile } = useAuth()
const channels = useChannels()
const messages = useMessages()
const users = useUsers()
const commandDefinitions = Object.values(definitions).map(command => ({
  ...command,
  args: argumentLabel(command)
}))
const route = useRoute()
const router = useRouter()
const channelName = computed(() => String(route.params.name || 'general'))
const drafts = useDrafts()
const draft = computed({
  get: () => drafts.get(channelName.value),
  set: value => drafts.set(channelName.value, value)
})
const composerInput = ref<QInput | null>(null)
const selected = ref(0)
const dismissed = ref(false)
const feedback = ref('')
const hasError = ref(false)
const helpOpen = ref(false)
const membersOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingDelete = computed(() =>
  pendingDeleteId.value === null
    ? undefined
    : channels.getById(pendingDeleteId.value)
)
const activeChannel = computed(() => channels.getByName(channelName.value))
const canSend = computed(
  () => !!activeChannel.value && channels.isJoined(activeChannel.value.id)
)
const activeCommand = computed(() =>
  commandDefinitions.find(command =>
    draft.value.startsWith('/' + command.name + ' ')
  )
)
const channelMembers = computed(() =>
  activeChannel.value
    ? channels.membersOf(activeChannel.value.id).map(member => ({
        ...member,
        isAdmin: member.id === activeChannel.value?.adminId
      }))
    : []
)
const mentionQuery = computed(() =>
  draft.value.startsWith('/')
    ? null
    : (draft.value.match(/(?:^|\s)@([^\s@]*)$/)?.[1] ?? null)
)
const suggestions = computed<Suggestion[]>(() => {
  const query = mentionQuery.value
  return query !== null
    ? channelMembers.value
        .filter(member =>
          member.nickname.toLowerCase().startsWith(query.toLowerCase())
        )
        .map(member => ({
          name: member.nickname,
          description: member.status,
          mention: true
        }))
    : commandDefinitions.filter(command =>
        command.name.startsWith(draft.value.slice(1).toLowerCase())
      )
})
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
function selectCommand(command: Suggestion) {
  draft.value = command.mention
    ? draft.value.replace(/@[^\s@]*$/, '@' + command.name + ' ')
    : '/' + command.name + ' '
  composerInput.value?.focus()
}
function onKeydown(event: KeyboardEvent) {
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
        .getElementById('command-' + selected.value)
        ?.scrollIntoView({ block: 'nearest' })
    )
  }
  if (['Enter', 'Tab'].includes(event.key)) {
    event.preventDefault()
    const suggestion = suggestions.value[selected.value]
    if (suggestion) selectCommand(suggestion)
  }
}
function showError(error: unknown) {
  hasError.value = true
  feedback.value =
    error instanceof Error ? error.message : 'Something went wrong.'
}
async function navigateTo(id?: number) {
  const channel =
    id === undefined ? channels.joinedChannels.value[0] : channels.getById(id)
  await router.push('/channels/' + (channel?.name || 'general'))
}
async function confirmDelete() {
  if (pendingDeleteId.value === null) return
  try {
    channels.remove(pendingDeleteId.value)
    pendingDeleteId.value = null
    await navigateTo()
  } catch (error) {
    pendingDeleteId.value = null
    showError(error)
  }
}
const currentMessages = computed(() =>
  activeChannel.value ? messages.forChannel(activeChannel.value.id) : []
)
const author = (message: Pick<Message, 'authorId'>) =>
  users.getById(message.authorId)?.nickname || 'Unknown user'
watch(channelName, () => {
  feedback.value = ''
  membersOpen.value = false
})
async function sendMessage() {
  if (!draft.value.trim()) return
  const sourceChannelName = channelName.value
  hasError.value = false
  feedback.value = ''
  try {
    if (draft.value.trim().startsWith('/')) {
      const input = draft.value.trim()
      const result = executeCommand(input, {
        channelId: activeChannel.value?.id ?? null
      })
      if (result.confirmDelete !== undefined) {
        pendingDeleteId.value = result.confirmDelete
        return
      }
      if (result.showHelp) helpOpen.value = true
      if (result.showMembers) membersOpen.value = true
      if (result.navigateTo !== undefined || input === '/cancel')
        await navigateTo(result.navigateTo)
      feedback.value = result.message || ''
    } else {
      if (!activeChannel.value)
        throw new Error('Join this channel before sending messages.')
      messages.send(activeChannel.value.id, draft.value)
    }
    drafts.remove(sourceChannelName)
    await nextTick()
    const history = document.querySelector('.message-history')
    history?.scrollTo({ top: history.scrollHeight, behavior: 'smooth' })
  } catch (error) {
    showError(error)
  }
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
  scrollbar-width: thin;
  scrollbar-color: $primary transparent;

  // Chromium/WebKit: a rounded green thumb without a track or arrow buttons.
  @supports selector(::-webkit-scrollbar) {
    scrollbar-width: auto;
    scrollbar-color: auto;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: $primary;
      border-radius: 999px;
      border: 1px solid $dark;
      min-height: 36px;
      &:hover {
        background: $accent;
      }
    }
    &::-webkit-scrollbar-button {
      display: none;
      width: 0;
      height: 0;
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  }
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
.message-mentioned {
  background: rgba($accent, 0.14);
  box-shadow: inset 3px 0 0 $accent;
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
