<template>
  <div>
    <h1 class="auth-heading">Welcome back!</h1>
    <p class="auth-subtitle">We're excited to see you again!</p>
    <q-form class="auth-form" @submit="onSubmit">
      <div>
        <label class="auth-label" for="login-nickname">
          Nickname <span class="auth-required" aria-hidden="true">*</span>
        </label>
        <q-input
          for="login-nickname"
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
        <label class="auth-label" for="login-password">
          Password <span class="auth-required" aria-hidden="true">*</span>
        </label>
        <q-input
          for="login-password"
          v-model="password"
          class="auth-input"
          name="password"
          autocomplete="current-password"
          aria-required="true"
          dark
          borderless
          hide-bottom-space
          lazy-rules
          :rules="[value => !!value || 'Enter your password']"
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
        label="Log In"
        type="submit"
        color="primary"
        no-caps
        unelevated
      />
    </q-form>
    <p class="auth-switch"
      >Need an account?
      <router-link to="/registration">Register</router-link></p
    >
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()
const $q = useQuasar()
const nickname = ref('')
const password = ref('')
const showPassword = ref(false)

const onSubmit = () => {
  // Prototype navigation only; credentials are not verified by a backend yet.
  $q.notify({
    color: 'info',
    message: 'Opening the chat preview.',
    position: 'top'
  })
  router.push('/channels/general')
}
</script>
