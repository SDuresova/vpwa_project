<template>
  <template v-for="(part, index) in parts" :key="index"
    ><mark v-if="part.mention" class="personal-mention">{{ part.text }}</mark
    ><template v-else>{{ part.text }}</template></template
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/states/auth'
const props = defineProps<{ text: string }>()
const { profile } = useAuth()
const parts = computed(() => {
  const result: { text: string; mention: boolean }[] = []
  let offset = 0
  for (const match of props.text.matchAll(/(?:^|\s)(@[a-zA-Z0-9_-]+)/g)) {
    const token = match[1]!
    const start = match.index + match[0].length - token.length
    result.push({ text: props.text.slice(offset, start), mention: false })
    result.push({
      text: token,
      mention:
        token.slice(1).toLowerCase() === profile.value.nickname.toLowerCase()
    })
    offset = start + token.length
  }
  result.push({ text: props.text.slice(offset), mention: false })
  return result
})
</script>

<style lang="scss">
.personal-mention {
  color: $text-link;
  background: rgba($accent, 0.22);
  border-radius: 3px;
  padding: 1px 3px;
  font-weight: 600;
}
</style>
