import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.API_URL || 'http://localhost:3333'}/api/v1`
})

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('vpwa-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(response => response, error => {
  const data = error.response?.data
  const message = data?.errors?.[0]?.message || data?.message || error.message || 'Request failed.'
  if (error.response?.status === 401) {
    sessionStorage.removeItem('vpwa-token')
    window.dispatchEvent(new Event('vpwa-unauthorized'))
  }
  return Promise.reject(new Error(message))
})
