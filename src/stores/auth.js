import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginUser } from '../services/api/auth'
import { clearSession, isValidSession, readSession, saveSession } from '../services/auth/session'

export const useAuthStore = defineStore('auth', () => {
  const restored = readSession()
  const saved = restored.session
  const token = ref(saved?.token ?? null)
  const expiresAt = ref(saved?.expires_at ?? null)
  const user = ref(saved?.user ?? null)
  const sessionNotice = ref(restored.invalid ? 'Сохранённая сессия недействительна. Войдите снова.' : '')
  let expiryTimer = null

  const isAuthenticated = computed(() => Boolean(
    token.value && user.value?.role === 'user' && Date.parse(expiresAt.value) > Date.now(),
  ))

  function logout() {
    if (expiryTimer) clearTimeout(expiryTimer)
    expiryTimer = null
    token.value = null
    expiresAt.value = null
    user.value = null
    clearSession()
  }

  function scheduleExpiry() {
    if (expiryTimer) clearTimeout(expiryTimer)
    const remaining = Date.parse(expiresAt.value) - Date.now()
    if (remaining <= 0) {
      logout()
      return
    }
    expiryTimer = setTimeout(() => {
      if (Date.parse(expiresAt.value) <= Date.now()) logout()
      else scheduleExpiry()
    }, Math.min(remaining, 2147483647))
  }

  function validToken() {
    if (!isAuthenticated.value) {
      if (token.value) logout()
      return null
    }
    return token.value
  }

  async function login(username, password) {
    const session = await loginUser(username, password)
    if (!isValidSession(session)) throw new Error('Некорректный ответ API авторизации')

    token.value = session.token
    expiresAt.value = session.expires_at
    user.value = session.user
    sessionNotice.value = ''
    saveSession(session)
    scheduleExpiry()
  }

  if (saved) scheduleExpiry()

  return { token, expiresAt, user, sessionNotice, isAuthenticated, login, logout, validToken }
})
