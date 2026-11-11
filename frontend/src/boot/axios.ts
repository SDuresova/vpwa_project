import { defineBoot } from '#q-app'
import { api } from '../services/api'
export { api }
export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api
})
