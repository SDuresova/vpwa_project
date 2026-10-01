<template>
  <div>
    <h2 class="text-h6 q-mb-md text-center">Registrácia</h2>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
            v-model="name"
            label="Vaše používateľské meno"
            lazy-rules
            :rules="[ 
                val => val && val.length > 0 || 'Zadaj používateľské meno',
            ]"
        />

        <q-input
            v-model="email"
            label="Váš email"
            lazy-rules
            :rules="[
                val => val && val.length > 0 || 'Zadaj email',
            ]"
        />

        <q-input
            v-model="password"
            type="password"
            label="Heslo"
            lazy-rules
            :rules="[
                val => !!val || 'Zadaj heslo',
                val => val.length >= 8 || 'Heslo musí mať aspoň 8 znakov'
            ]"
        />

        <div>
            <q-btn label="Odoslať" type="submit" color="primary"/>
            <router-link to="/prihlasenie" class="block q-mt-md">Máš už účet? Prihlás sa!</router-link>
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
  $q.notify({ color: 'green-4', message: 'Úspešne zaregistrovaný! Prihláste sa.', position: 'top' })
}
</script>