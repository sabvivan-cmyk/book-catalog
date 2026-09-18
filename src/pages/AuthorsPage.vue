<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuthors, deleteAuthor } from '../services/api/authors'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const pageSize = 6
const search = ref('')
const authors = ref([])
const pagination = ref(null)
const loading = ref(false)
const error = ref('')
const needsLogin = ref(false)
const deletingId = ref(null)
let requestNumber = 0

const currentPage = computed(() => Number(pagination.value?.page) || 1)
const totalPages = computed(() => Math.max(1, Number(pagination.value?.total_pages) || 1))

function routeSearch() {
  const value = Array.isArray(route.query.search) ? route.query.search[0] : route.query.search
  return typeof value === 'string' ? value.trim() : ''
}

function routePage() {
  const value = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : 1
}

async function loadAuthors() {
  const request = ++requestNumber
  loading.value = true
  error.value = ''
  needsLogin.value = false
  try {
    const data = await getAuthors({ page: routePage(), perPage: pageSize, search: routeSearch() })
    if (request !== requestNumber) return
    authors.value = data.items
    pagination.value = data.pagination
  } catch {
    if (request !== requestNumber) return
    authors.value = []
    pagination.value = null
    error.value = 'Не удалось загрузить авторов. Проверьте подключение к API.'
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

function submitSearch() {
  const query = search.value.trim() ? { search: search.value.trim() } : {}
  router.push({ name: 'authors', query })
}

function goToPage(page) {
  const query = { ...route.query }
  if (page > 1) query.page = String(page)
  else delete query.page
  router.push({ name: 'authors', query })
}

async function removeAuthor(author) {
  if (deletingId.value !== null || !window.confirm(`Удалить автора «${author.full_name}»?`)) return
  deletingId.value = author.id
  error.value = ''
  needsLogin.value = false
  try {
    await deleteAuthor(author.id)
    const page = routePage()
    if (authors.value.length === 1 && page > 1) {
      goToPage(page - 1)
    } else {
      await loadAuthors()
    }
  } catch (caught) {
    const status = caught.response?.status
    needsLogin.value = status === 401
    error.value = status === 401 ? 'Сессия завершилась. Войдите снова.'
      : status === 403 ? 'Недостаточно прав для удаления автора.'
        : status === 404 ? 'Автор уже удалён. Обновите список.'
          : 'Не удалось удалить автора. Попробуйте ещё раз.'
  } finally {
    deletingId.value = null
  }
}

watch(() => route.fullPath, () => {
  search.value = routeSearch()
  loadAuthors()
}, { immediate: true })
</script>

<template>
  <main class="container py-4 py-md-5">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <h1 class="mb-0">Авторы</h1>
      <RouterLink v-if="auth.isAuthenticated" class="btn btn-primary" :to="{ name: 'author-create' }">Добавить автора</RouterLink>
    </div>

    <form class="card card-body mb-4" @submit.prevent="submitSearch">
      <label for="author-search" class="form-label">Поиск автора</label>
      <div class="d-flex flex-wrap gap-2">
        <input id="author-search" v-model="search" class="form-control flex-grow-1" type="search" placeholder="ФИО автора" />
        <button class="btn btn-primary" type="submit">Найти</button>
      </div>
    </form>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <RouterLink v-if="needsLogin" :to="{ name: 'login', query: { redirect: route.fullPath } }" class="alert-link">Войти</RouterLink>
      <button v-else class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadAuthors">Повторить</button>
    </div>
    <div v-if="loading" class="text-secondary" role="status">Загрузка авторов…</div>
    <template v-else-if="!error">
      <div v-if="authors.length === 0" class="alert alert-light border">Авторы не найдены.</div>
      <template v-else>
        <p class="text-secondary small">Всего авторов: {{ pagination?.total }}</p>
        <ul class="list-group">
          <li v-for="author in authors" :key="author.id" class="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2">
            <RouterLink class="author-name" :to="{ name: 'author', params: { id: author.id } }">{{ author.full_name }}</RouterLink>
            <span v-if="auth.isAuthenticated" class="d-flex flex-wrap gap-2">
              <RouterLink class="btn btn-outline-primary btn-sm" :to="{ name: 'author-edit', params: { id: author.id } }">Редактировать</RouterLink>
              <button class="btn btn-outline-danger btn-sm" type="button" :disabled="deletingId !== null" @click="removeAuthor(author)">
                {{ deletingId === author.id ? 'Удаление…' : 'Удалить' }}
              </button>
            </span>
          </li>
        </ul>
        <nav v-if="totalPages > 1" class="d-flex align-items-center justify-content-center gap-3 mt-4" aria-label="Страницы авторов">
          <button class="btn btn-outline-primary" type="button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Назад</button>
          <span>Страница {{ currentPage }} из {{ totalPages }}</span>
          <button class="btn btn-outline-primary" type="button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Вперёд</button>
        </nav>
      </template>
    </template>
  </main>
</template>
