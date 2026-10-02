<template>
  <div>
    <h2 class="text-h6 q-mb-md text-center">Registrácia</h2>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
            v-model="name"
            label="Username"
            lazy-rules
            :rules="[ 
                val => val && val.length > 0 || 'Enter your username',
            ]"
        />

        <q-input
            v-model="email"
            label="Email"
            lazy-rules
            :rules="[
                val => val && val.length > 0 || 'Enter your email',
            ]"
        />

        <q-input
            v-model="password"
            type="password"
            label="Password"
            lazy-rules
            :rules="[
                val => !!val || 'Password',
                val => val.length >= 8 || 'Password needs to be atleast 8 characters long.'
            ]"
        />

        <div>
            <q-btn label="Submit" type="submit" color="primary"/>
            <router-link to="/login" class="block q-mt-md">Have already an account? Log in!</router-link>
        </div>
  </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const name = ref(null)
const email = ref(null)
const password = ref(null)

const onSubmit = () => {
  // Form is validated successfully here
  $q.notify({ color: 'green-4', message: 'Successfuly registered! Log in.', position: 'top' })
}
</script>