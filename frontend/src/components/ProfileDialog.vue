<template>
  <q-dialog v-model="open" @before-show="resetDraft">
    <q-card class="profile-card">
      <div class="profile-banner">
        <q-btn flat round icon="close" aria-label="Close profile" v-close-popup />
      </div>

      <q-card-section>
        <q-avatar class="profile-large-avatar" size="64px" color="primary" text-color="white">
          {{ initials }}
        </q-avatar>
        <h2 class="profile-name">{{ fullName || profile.nickname }}</h2>
        <p class="muted">@{{ profile.nickname }}</p>

        <q-form class="q-gutter-md" @submit="save">
          <div class="name-fields">
            <q-input dark outlined dense v-model.trim="draft.firstName" label="First name" :rules="required" />
            <q-input dark outlined dense v-model.trim="draft.lastName" label="Surname" :rules="required" />
          </div>
          <q-input dark outlined dense v-model.trim="draft.nickname" label="Nickname" :rules="required" />
          <q-input dark outlined dense v-model.trim="draft.email" label="Email" type="email" :rules="required" />
          <q-select
            dark
            outlined
            dense
            v-model="draft.status"
            :options="['online', 'dnd', 'offline']"
            label="Status"
          />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn color="primary" label="Save profile" type="submit" no-caps />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuth } from '@/states/auth'
import { useAttempt } from '@/composables/useAttempt'

const open = defineModel<boolean>({ required: true })

const attempt = useAttempt()
const { profile, fullName, initials, updateProfile } = useAuth()

const draft = reactive({ ...profile.value })
const required = [(value: string) => !!value?.trim() || 'This field is required']

/** Pri každom otvorení začne formulár z aktuálneho profilu. */
function resetDraft() {
  Object.assign(draft, profile.value)
}

function save() {
  attempt(() => {
    const { id: _id, ...changes } = draft
    updateProfile(changes)
    open.value = false
  })
}
</script>

<style lang="scss">
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