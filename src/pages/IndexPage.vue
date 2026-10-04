<template>
  <q-page class="q-pa-md column justify-end">
    <q-infinite-scroll reverse :offset="200">
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner color="primary" size="32px" />
        </div>
      </template>

      <div class="text-center text-caption text-grey-6 q-my-md">
        Today
      </div>

      <q-chat-message
        v-for="(msg, i) in messages"
        :key="i"
        :name="msg.author"
        :text="[msg.text]"
        :stamp="msg.time"
        :sent="msg.author === 'jozko'"
        :bg-color="msg.mentionsMe ? 'amber-2' : (msg.author === 'jozko' ? 'primary' : 'grey-3')"
        :text-color="msg.author === 'jozko' ? 'white' : 'dark'"
      >
      <template #avatar>
        <q-avatar
          :color="msg.author === 'jozko' ? 'primary' : 'grey-5'"
          text-color="white"
          size="36px"
          :class="msg.author === 'jozko' ? 'q-ml-sm' : 'q-mr-sm'"
        >
          {{ msg.author[0].toUpperCase() }}
        </q-avatar>
      </template>

      </q-chat-message>
    </q-infinite-scroll>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([
  { author: 'ed', text: 'Message 1', time: '14:02' },
  { author: 'jozko', text: 'Message 2', time: '14:05' },
  { author: 'maria', text: 'Message 3', time: '14:06' },
  { author: 'ed', text: 'Message 4', time: '14:10'},
  { author: 'jozko', text: 'Message 5', time: '14:11' },
])

const channelName = "#general"
</script>

<style scoped lang="scss">

</style>
