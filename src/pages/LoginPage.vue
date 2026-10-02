<template>
  <div>
    <h2 class="text-h6 q-mb-md text-center">Log in;</h2>
      <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
        <q-input
            v-model="name"
            label="Username"
            lazy-rules
            :rules="[ 
                val => val && val.length > 0 || 'Enter your username',
            ]"
        />

        <q-input
            v-model="password"
            type="password"
            label="Password"
            lazy-rules
            :rules="[
                val => !!val || 'Enter your password',
            ]"
        />

        <div>
            <q-btn label="Submit" type="submit" color="primary"/>
            <router-link to="/registration" class="block q-mt-md">Still dont have an account? Register now!</router-link>
        </div>
  </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()
const $q = useQuasar()
const name = ref(null)
const password = ref(null)

const onSubmit = () => {
  // Form is validated successfully here
  $q.notify({ color: 'green-4', message: 'Successfuly logged in!', position: 'top' })
  router.push('/')

}

</script>