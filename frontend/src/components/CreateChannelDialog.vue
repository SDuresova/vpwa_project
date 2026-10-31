<template>
  <q-dialog v-model="open">
    <q-card class="profile-card q-pa-lg">
      <h2 class="profile-name q-mt-none">Create a channel</h2>

      <q-form class="q-gutter-md" @submit="submit">
        <q-input dark outlined v-model.trim="name" label="Channel name" :rules="rules" />
        <q-option-group dark v-model="type" inline :options="typeOptions" />
        <div class="row justify-end">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create" type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChannels } from '@/states/channels'
import { useAttempt } from '@/composables/useAttempt'
import type { ChannelPrivacyType } from '@/types/channel'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ created: [] }>()

const router = useRouter()
const attempt = useAttempt()
const { channels, create } = useChannels()

const name = ref('')
const type = ref<ChannelPrivacyType>('public')

const typeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' }
]
const rules = [
  (v: string) => /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers and hyphens',
  (v: string) => !channels.value.some(c => c.name === v) || 'This channel already exists'
]

function submit() {
  attempt(() => {
    create(name.value, type.value)
    router.push('/channels/' + name.value)
    name.value = ''
    type.value = 'public'
    open.value = false
    emit('created')
  })
}
</script>