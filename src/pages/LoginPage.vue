<template>
  <div>
    <h2 class="text-h6 q-mb-md text-center">Prihlásenie</h2>
      <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
        <q-input
            v-model="name"
            label="Vaše používateľské meno"
            lazy-rules
            :rules="[ 
                val => val && val.length > 0 || 'Zadaj používateľské meno',
            ]"
        />

        <q-input
            v-model="password"
            type="password"
            label="Heslo"
            lazy-rules
            :rules="[
                val => !!val || 'Zadaj heslo',
            ]"
        />

        <div>
            <q-btn label="Odoslať" type="submit" color="primary"/>
            <router-link to="/registracia" class="block q-mt-md">Nemáš ešte účet? Registruj sa!</router-link>
        </div>
  </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const name = ref(null)
const password = ref(null)

const onSubmit = () => {
  // Form is validated successfully here
  $q.notify({ color: 'green-4', message: 'odlsane', position: 'top' })
}

</script>