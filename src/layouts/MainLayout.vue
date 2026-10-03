<template>
  <q-layout view="lHr LpR lFr">
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

    <!-- left panel with servers -->
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
          <q-btn flat round dense size="sm" icon="add" @click="createDialog = true" />
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
          <q-item-label class="text-weight-bold">@jozko</q-item-label>
          <q-item-label caption class="text-white" style="opacity: 0.7">
            {{ status }}
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
    
    <!-- right panel with memmbers -->
    <q-drawer v-model="rightDrawerOpen" side="right" show-if-above bordered :width="240" class="bg-primary text-white">
      <q-list>

        <q-item-label header class="text-white">
            Members
        </q-item-label>

        <q-item
          v-for="m in channels.find(c => c.name === ($route.params.name || 'general')).members"
          :key="m.nick"
        >
          <!-- Nick -->
          <q-item-section>
            <div class="row items-center no-wrap q-gutter-x-sm">
              <q-avatar color="white" text-color="primary" size="38px">
                {{m.nick.charAt(0).toUpperCase()}}
                <q-badge
                  floating
                  rounded
                  :color="statusColors[m.status]"
                  class="status-dot"
                />
              </q-avatar>
              <q-item-label :class="m.isAdmin ? 'text-weight-bold text-amber-9' : ''">
                {{ m.nick }}
                <q-icon v-if="m.isAdmin" name="star" color="amber-8" size="18px" class="q-ml-xs" />
              </q-item-label>
            </div>
          </q-item-section>
        </q-item>

      </q-list>
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


    <!-- popup to create server-->
  <q-dialog v-model="createDialog">
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Create channel</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input outlined dense v-model="newChannelName" label="Channel name">
          <template #prepend><q-icon name="tag" /></template>
        </q-input>

        <q-option-group
          v-model="newChannelType"
          inline
          :options="[
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' }
          ]"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn unelevated color="primary" label="Create" v-close-popup @click="addServer" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  </q-layout>
</template>

<script setup>
  import { ref } from 'vue'

  // opener for popup creating new server
  const createDialog = ref(false)
  // reactive var for channel naem
  const newChannelName = ref('')
  // same thign but type
  const newChannelType = ref('public')
  // status var
  const status = ref('online')
  // opener for hambuger
  const leftDrawerOpen = ref(false)

  // status colors
  const statusColors = {
    online: 'positive',
    DND: 'negative',
    offline: 'grey-6'
  }
  // channel fake data 
  const channels =ref([
    { name: 'pozvanka-projekt', 
      type: 'private', 
      invited: true 
    },
    { name: 'general', 
      type: 'public', 
      unread: 3,
      members: [
        { nick: 'jozko', status: 'online', },
        { nick: 'alice', status: 'online' },
        { nick: 'bob', status: 'DND' },
        { nick: 'cyprian', status: 'offline', isAdmin: true }
      ] 
    },
    { name: 'random',
      type: 'public', 
      isAdmin: true,
      members: [
        { nick: 'jozko', status: 'online', },
        { nick: 'david', status: 'online' },
        { nick: 'fabio', status: 'DND' },
        { nick: 'gusto', status: 'offline', isAdmin: true }
      ]
    },
    { name: 'vpwa-tim', 
      type: 'private', 
      unread: 1,
      members: [
        { nick: 'jozko', status: 'online', isAdmin: true },
        { nick: 'hogyvagy', status: 'online' },
        { nick: 'ida', status: 'DND' },
      ] 
    }
  ])

  // opener for left hambugfeg
  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  // push data to our fake data
  function addServer() {
    channels.value.push({
      name: newChannelName.value,
      type: newChannelType.value,
      isAdmin: true,
      members: [{ nick: 'jozko', status: 'online', isAdmin: true }]
    })

    // reset variables
    newChannelName.value = ''
    newChannelType.value = 'public'    
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