<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container>
      <q-page class="auth-page flex flex-center">
        <main class="auth-wrapper">
          <q-card flat class="auth-card">
            <router-view />
          </q-card>
          <p class="auth-footer">&copy; 2026 VPWA project</p>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
// Kept under .auth-page so shared styles only affect authentication pages.
.auth-page {
  // Cover fills the page without stretching; centre keeps the middle in view.
  // A dark overlay softens the photograph so the form stays easy to read.
  background-color: $dark-page;
  background-image:
    linear-gradient(rgba($dark-page, 0.42), rgba($dark-page, 0.42)),
    url('../assets/auth-background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: $text-body;
  padding: 32px 16px;

  .auth-wrapper {
    width: 100%;
    max-width: 480px;
    min-width: 0;
  }

  .auth-card {
    padding: 32px;
    background: $dark;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
  }

  .auth-heading {
    margin: 0 0 8px;
    color: $text-heading;
    font-size: 24px;
    line-height: 1.3;
    font-weight: 700;
    text-align: center;
  }

  .auth-subtitle {
    margin: 0 0 28px;
    color: $text-muted;
    text-align: center;
  }

  .auth-form {
    display: grid;
    gap: 20px;
  }

  .auth-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  .auth-required {
    color: $text-error;
  }

  .auth-input {
    .q-field__control {
      min-height: 44px;
      height: 44px;
      padding: 0 12px;
      border-radius: 4px;
      background: $surface-input;
      color: $focus-ring;
    }
    .q-field__native {
      color: $text-body;
      padding: 10px 0;
    }
    .q-field__marginal {
      height: 44px;
      color: $text-muted;
    }
    &.q-field--focused .q-field__control {
      outline: 2px solid $focus-ring;
      outline-offset: 2px;
    }
    &.q-field--error .q-field__bottom,
    &.q-field--error .q-field__append {
      color: $text-error;
    }
    &.q-field--error .q-field__control {
      outline: 1px solid $text-error;
    }
  }

  .auth-name-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .auth-submit {
    min-height: 44px;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
  }

  .auth-switch {
    margin: 20px 0 0;
    color: $text-muted;
    font-size: 14px;
  }

  a {
    color: $text-link;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  a:focus-visible,
  .q-btn:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 3px;
  }

  .auth-footer {
    margin: 20px 0 0;
    color: $text-heading;
    text-shadow: 0 1px 4px $dark-page;
    font-size: 12px;
    text-align: center;
  }

  @media (max-width: 480px) {
    padding: 24px 16px;
    .auth-card {
      padding: 24px;
    }
    .auth-name-row {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
}
</style>
