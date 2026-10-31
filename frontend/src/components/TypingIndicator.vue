<template>
  <div v-if="participant" class="typing-area" role="status">
    <template v-if="typing">
      <span class="typing-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span
        ><strong>{{ participant.nickname }}</strong> is typing…</span
      >
      <span class="demo-label">Demo</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Member } from '@/types/member'

const props = defineProps<{
  channelId: number | undefined
  members: readonly Readonly<Member>[]
  currentUserId: number
  enabled: boolean
}>()

// Simulate presence for the SPA prototype, without exposing anyone's draft.
const participant = computed(() =>
  props.enabled
    ? props.members.find(
        member =>
          member.id !== props.currentUserId && member.status !== 'offline'
      )
    : undefined
)
const typing = ref(false)

watch(
  () => [props.channelId, participant.value?.id] as const,
  (_value, _previous, onCleanup) => {
    typing.value = false
    if (!participant.value) return
    let timer: ReturnType<typeof setTimeout>
    function toggleTyping() {
      typing.value = !typing.value
      timer = setTimeout(toggleTyping, typing.value ? 8000 : 3000)
    }
    timer = setTimeout(toggleTyping, 1200)
    onCleanup(() => clearTimeout(timer))
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.typing-area {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin: 0 4px 10px;
  font-size: 12px;
  color: $text-muted;
  strong {
    color: $text-link;
    overflow-wrap: anywhere;
  }
}
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  span {
    width: 4px;
    height: 4px;
    background: $text-link;
    border-radius: 50%;
    animation: typing-bounce 1.2s ease-in-out infinite;
    &:nth-child(2) {
      animation-delay: 0.15s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}
@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .typing-dots span {
    animation: none;
  }
}
.demo-label {
  margin-left: auto;
  font-size: 10px;
}
</style>
