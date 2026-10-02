<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> VPVA SLACK - # {{ $route.params.name || 'general' }} </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-primary text-white">
      <!--channels -->
      <q-list dark>
        <template v-if="channels.filter(c => c.invited).length">
          <q-item-label header class="text-white">Invites</q-item-label>

          <q-item v-for="ch in channels.filter(c => c.invited)" :key="ch.name" clickable class="invite-item">
            <q-item-section avatar>
              <q-icon :name="ch.type === 'private' ? 'lock' : 'tag'" />
            </q-item-section>
            <q-item-section class="text-weight-bold">{{ ch.name }}</q-item-section>
            <q-item-section side>
              <q-badge color="accent" text-color="dark" label="New" />
            </q-item-section>
          </q-item>
        </template>

        <q-item-label header class="text-white row items-center justify-between">
            Channels
          <q-btn flat round dense size="sm" icon="add" />
        </q-item-label>

        <q-item
          v-for="ch in channels.filter(c => !c.invited)"
          :key="ch.name"
          clickable
          :to="`/channels/${ch.name}`"
          active-class="bg-white text-primary"
        >
          <q-item-section avatar>
            <q-icon :name="ch.type === 'private' ? 'lock' : 'tag'" />
          </q-item-section>
          <q-item-section>{{ ch.name }}</q-item-section>

          <q-item-section side class="row items-center no-wrap">
            <q-badge v-if="ch.unread" color="negative" :label="ch.unread" />
            <q-btn flat round dense size="sm" icon="more_vert" @click.prevent.stop>
              <q-menu>
                <q-list dense style="min-width: 140px">
                  <q-item clickable v-close-popup>
                    <q-item-section>Leave channnel</q-item-section>
                  </q-item>
                  <q-item v-if="ch.isAdmin" clickable v-close-popup class="text-negative">
                    <q-item-section>Delete channnel</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>

      </q-list>        

      <q-separator dark />

      <!-- Profil + state -->
      <q-item clickable class="q-py-md">
        <q-item-section avatar>
          <q-avatar color="white" text-color="primary" size="38px">
            JN
            <q-badge
              floating
              rounded
              :color="statusColors[status]"
              class="status-dot"
            />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">Jozef Novák</q-item-label>
          <q-item-label caption class="text-white" style="opacity: 0.7">
            @jozko · {{ status }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon name="expand_less" color="white" />
        </q-item-section>

        <q-menu anchor="top middle" self="bottom middle" fit>
          <q-list dense>
            <q-item
              v-for="s in ['online', 'DND', 'offline']"
              :key="s"
              clickable
              v-close-popup
              @click="status = s"
            >
              <q-item-section avatar>
                <q-icon name="circle" size="12px" :color="statusColors[s]" />
              </q-item-section>
              <q-item-section>{{ s }}</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup to="/settings">
              <q-item-section avatar><q-icon name="settings" size="18px" /></q-item-section>
              <q-item-section>Settings</q-item-section>
            </q-item>
            <q-item clickable v-close-popup to="/login" class="text-negative">
              <q-item-section avatar><q-icon name="logout" size="18px" /></q-item-section>
              <q-item-section>Log out</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- cmd footer -->
    <q-footer bordered class="bg-white text-dark">
      <div class="q-px-md q-pt-xs text-caption text-grey-7 typing">
        <span class="text-weight-bold cursor-pointer text-primary">Ed</span> is typing…
      </div>

      <div class="q-px-md q-pb-sm q-pt-xs">
        <q-input
          outlined
          dense
          rounded
          placeholder="Message #general or type /command"
        >
          <template #append>
            <q-btn flat round dense icon="send" color="primary" />
          </template>
        </q-input>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
  import { ref } from 'vue'

  const channels = [
    { name: 'pozvanka-projekt', type: 'private', invited: true },
    { name: 'general', type: 'public', unread: 3 },
    { name: 'random', type: 'public', isAdmin: true },
    { name: 'vpwa-tim', type: 'private', unread: 1 }
  ]
  
  const leftDrawerOpen = ref(false)

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  const status = ref('online')

  const statusColors = {
    online: 'positive',
    DND: 'negative',
    offline: 'grey-6'
  }
  
</script>


<style scoped lang="scss">
  .invite-item {
    background: rgba(255, 255, 255, 0.12);
    border-left: 3px solid $accent;
  }
  .status-dot {
    width: 12px;
    height: 12px;
    padding: 0;
    border: 2px solid $primary;
    top: auto;
    bottom: -2px;
    right: -2px;
  }

  .typing {
    min-height: 20px;
  }
</style>