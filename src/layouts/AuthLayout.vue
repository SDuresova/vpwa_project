<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
      <q-page class="auth-page flex flex-center">

        <div class="auth-wrapper">
          <q-card flat class="auth-card q-pa-lg">
            <div class="column items-center q-mb-lg">
                <div class="logo-badge flex flex-center">
                    <q-icon name="forum" size="28px" color="white" />
                </div>
                <h1 class="text-h5 text-weight-bold q-mt-md">Slack</h1>
                <p class="text-grey-6 text-body2">Lorem ipsum</p>
            </div>

            <router-view />
          </q-card>

          <p class="text-center text-white q-mt-lg" style="opacity: 0.6; font-size: 12px">
            &copy; 2026 VPWA project
          </p>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, $primary 0%, darken($primary, 25%) 100%);
}

.auth-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.auth-card {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.logo-badge {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, $primary, $secondary);
  box-shadow: 0 8px 20px rgba($primary, 0.4);
}
</style>
