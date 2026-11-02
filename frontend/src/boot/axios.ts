import { defineBoot } from '#q-app'
import axios from 'axios'

// one istance for every backend call
const api = axios.create({
  baseURL: `${import.meta.env.API_URL}/api/v1`,
  // sending also cookies
  withCredentials: true
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }