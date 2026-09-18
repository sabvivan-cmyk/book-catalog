<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.push('/books')
}
</script>

<template>
  <header class="border-bottom bg-light">
    <nav class="container d-flex flex-wrap align-items-center gap-3 py-3" aria-label="Основная навигация">
      <RouterLink class="text-decoration-none" to="/books">Книги</RouterLink>
      <RouterLink class="text-decoration-none" to="/authors">Авторы</RouterLink>
      <RouterLink class="text-decoration-none" to="/reports/top-authors">ТОП авторов</RouterLink>
      <div class="ms-auto">
        <span v-if="auth.isAuthenticated" class="d-flex align-items-center gap-3">
          <span class="text-secondary">{{ auth.user?.username }}</span>
          <button class="btn btn-outline-secondary btn-sm" type="button" @click="logout">Выйти</button>
        </span>
        <RouterLink v-else class="btn btn-outline-primary btn-sm" to="/login">Войти</RouterLink>
      </div>
    </nav>
  </header>
  <RouterView />
</template>
