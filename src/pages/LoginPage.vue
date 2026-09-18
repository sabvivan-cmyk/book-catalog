<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) return
  error.value = ''
  loading.value = true

  try {
    await auth.login(username.value, password.value)
    password.value = ''
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' && redirect.startsWith('/') &&
      !redirect.startsWith('//') && router.resolve(redirect).name !== 'login'
      ? redirect
      : '/books'
    await router.replace(target)
  } catch (caught) {
    error.value = caught.response?.status === 401
      ? 'Неверное имя пользователя или пароль.'
      : 'Не удалось войти. Попробуйте ещё раз.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container py-4 py-md-5">
    <div class="mx-auto" style="max-width: 420px">
      <h1 class="mb-4">Вход</h1>
      <div v-if="auth.sessionNotice" class="alert alert-info" role="status">{{ auth.sessionNotice }}</div>
      <form class="card card-body" @submit.prevent="submit">
        <div class="mb-3">
          <label for="username" class="form-label">Имя пользователя</label>
          <input id="username" v-model.trim="username" class="form-control" autocomplete="username" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Пароль</label>
          <input id="password" v-model="password" class="form-control" type="password" autocomplete="current-password" required />
        </div>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Выполняется вход…' : 'Войти' }}
        </button>
      </form>
    </div>
  </main>
</template>
