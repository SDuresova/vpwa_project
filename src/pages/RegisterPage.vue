<template>
  <div>
    <h1 class="auth-heading">Create an account</h1>
    <p class="auth-subtitle">Your next conversation starts here.</p>
    <q-form class="auth-form" @submit="onSubmit">
      <div class="auth-name-row">
        <div>
          <label class="auth-label" for="register-first-name">
            First name <span class="auth-required" aria-hidden="true">*</span>
          </label>
          <q-input
            for="register-first-name"
            v-model.trim="firstName"
            class="auth-input"
            name="firstName"
            autocomplete="given-name"
            aria-required="true"
            dark
            borderless
            hide-bottom-space
            lazy-rules
            :rules="[value => !!value.trim() || 'Enter your first name']"
          />
        </div>
        <div>
          <label class="auth-label" for="register-surname">
            Surname <span class="auth-required" aria-hidden="true">*</span>
          </label>
          <q-input
            for="register-surname"
            v-model.trim="surname"
            class="auth-input"
            name="surname"
            autocomplete="family-name"
            aria-required="true"
            dark
            borderless
            hide-bottom-space
            lazy-rules
            :rules="[value => !!value.trim() || 'Enter your surname']"
          />
        </div>
      </div>

      <div>
        <label class="auth-label" for="register-nickname">
          Nickname <span class="auth-required" aria-hidden="true">*</span>
        </label>
        <q-input
          for="register-nickname"
          v-model.trim="nickname"
          class="auth-input"
          name="nickname"
          autocomplete="username"
          aria-required="true"
          dark
          borderless
          hide-bottom-space
          lazy-rules
          :rules="[value => !!value.trim() || 'Enter your nickname']"
        />
      </div>

      <div>
        <label class="auth-label" for="register-email">
          Email <span class="auth-required" aria-hidden="true">*</span>
        </label>
        <q-input
          for="register-email"
          v-model.trim="email"
          class="auth-input"
          name="email"
          autocomplete="email"
          aria-required="true"
          dark
          borderless
          hide-bottom-space
          lazy-rules
          :rules="[
            value => !!value || 'Enter your email',
            value =>
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
              'Enter a valid email address'
          ]"
          type="email"
        />
      </div>

      <div>
        <label class="auth-label" for="register-password">
          Password <span class="auth-required" aria-hidden="true">*</span>
        </label>
        <q-input
          for="register-password"
          v-model="password"
          class="auth-input"
          name="password"
          autocomplete="new-password"
          aria-required="true"
          dark
          borderless
          hint="Use at least 8 characters."
          lazy-rules
          :rules="[
            value => !!value || 'Enter your password',
            value => value.length >= 8 || 'Use at least 8 characters'
          ]"
          :type="showPassword ? 'text' : 'password'"
        >
          <template #append>
            <q-btn
              flat
              round
              dense
              type="button"
              :icon="showPassword ? 'visibility_off' : 'visibility'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </div>
      <q-btn
        class="auth-submit"
        label="Create Account"
        type="submit"
        color="primary"
        no-caps
        unelevated
      />
    </q-form>
    <p class="auth-switch"
      >Already have an account? <router-link to="/login">Log in</router-link></p
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuth } from '@/states/auth'
const { updateProfile } = useAuth()

const router = useRouter()
const $q = useQuasar()
const firstName = ref('')
const surname = ref('')
const email = ref('')
const nickname = ref('')
const password = ref('')
const showPassword = ref(false)

const onSubmit = () => {
  try {
    updateProfile({
      firstName: firstName.value,
      lastName: surname.value,
      nickname: nickname.value,
      email: email.value
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Registration failed.'
    })
    return
  }
  // Prototype navigation only; no account is saved yet.
  $q.notify({
    color: 'info',
    message: 'Registration preview complete. Try the login screen.',
    position: 'top'
  })
  router.push('/login')
}
</script>
