import { useQuasar } from 'quasar'

// run action by error and show message
export function useAttempt() {
  const $q = useQuasar()

  return (fn: () => void) => {
    try {
      fn()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error instanceof Error ? error.message : 'Something went wrong.'
      })
    }
  }
}