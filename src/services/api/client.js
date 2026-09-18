import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
})

export function configureApiAuth(authStore) {
  api.interceptors.request.use((config) => {
    if (config.url !== '/auth/login') {
      const token = authStore.validToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
        authStore.logout()
      }
      return Promise.reject(error)
    },
  )
}

export default api
