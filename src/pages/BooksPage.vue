<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import { getBooks } from '../services/api/books'
import { getAuthors } from '../services/api/authors'

const route = useRoute()
const router = useRouter()
const pageSize = 20

const search = ref('')
const year = ref('')
const authorId = ref('')
const books = ref([])
const pagination = ref(null)
const authors = ref([])
const loading = ref(false)
const booksError = ref(false)
const authorsLoading = ref(false)
const authorsError = ref(false)
let requestNumber = 0

const totalPages = computed(() => Math.max(1, Number(pagination.value?.total_pages) || 1))
const currentPage = computed(() => Number(pagination.value?.page) || 1)
const firstItem = computed(() => (currentPage.value - 1) * (Number(pagination.value?.per_page) || pageSize) + 1)
const lastItem = computed(() => Math.min(pagination.value?.total || 0, currentPage.value * (Number(pagination.value?.per_page) || pageSize)))

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function positiveInteger(value, fallback) {
  const number = Number(queryValue(value))
  return Number.isInteger(number) && number > 0 ? number : fallback
}

function integerOrNull(value) {
  const number = Number(queryValue(value))
  return Number.isInteger(number) ? number : null
}

function filtersFromRoute() {
  const searchValue = queryValue(route.query.search)
  const yearValue = queryValue(route.query.year)
  const authorValue = queryValue(route.query.author_id)

  return {
    page: positiveInteger(route.query.page, 1),
    search: typeof searchValue === 'string' ? searchValue.trim() : '',
    year: yearValue !== undefined && yearValue !== '' ? integerOrNull(yearValue) : null,
    authorId: authorValue !== undefined && authorValue !== '' ? positiveInteger(authorValue, null) : null,
  }
}

async function loadBooks() {
  const request = ++requestNumber
  const filters = filtersFromRoute()
  loading.value = true
  booksError.value = false

  try {
    const data = await getBooks({ ...filters, perPage: pageSize })
    if (request !== requestNumber) return
    books.value = data.items
    pagination.value = data.pagination
  } catch {
    if (request !== requestNumber) return
    books.value = []
    pagination.value = null
    booksError.value = true
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

async function loadAuthors() {
  authorsLoading.value = true
  authorsError.value = false

  try {
    let page = 1
    let totalPages = 1
    const allAuthors = []

    while (page <= totalPages) {
      const data = await getAuthors({ page, perPage: 100 })
      allAuthors.push(...data.items)
      totalPages = Number(data.pagination.total_pages) || 1
      page += 1
    }

    authors.value = allAuthors
  } catch {
    authorsError.value = true
  } finally {
    authorsLoading.value = false
  }
}

function applyFilters() {
  const query = {}
  const searchValue = search.value.trim()
  if (searchValue) query.search = searchValue
  if (year.value !== '') query.year = String(year.value)
  if (authorId.value !== '') query.author_id = String(authorId.value)
  router.push({ path: '/books', query })
}

function resetFilters() {
  search.value = ''
  year.value = ''
  authorId.value = ''
  router.push({ path: '/books' })
}

function goToPage(page) {
  const query = { ...route.query }
  if (page > 1) query.page = String(page)
  else delete query.page
  router.push({ path: '/books', query })
}

watch(
  () => route.fullPath,
  () => {
    const filters = filtersFromRoute()
    search.value = filters.search
    year.value = filters.year == null ? '' : String(filters.year)
    authorId.value = filters.authorId == null ? '' : String(filters.authorId)
    loadBooks()
  },
  { immediate: true },
)

onMounted(loadAuthors)
</script>

<template>
  <main class="container py-4 py-md-5">
    <h1 class="mb-4">Book Catalog</h1>

    <form class="card card-body mb-4" @submit.prevent="applyFilters">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-4">
          <label for="book-search" class="form-label">Поиск</label>
          <input id="book-search" v-model="search" class="form-control" type="search" placeholder="Поиск по книгам" />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <label for="book-year" class="form-label">Год</label>
          <input id="book-year" v-model="year" class="form-control" type="number" step="1" placeholder="Год выпуска" />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <label for="book-author" class="form-label">Автор</label>
          <select id="book-author" v-model="authorId" class="form-select" :disabled="authorsLoading || authorsError">
            <option value="">Все авторы</option>
            <option v-for="author in authors" :key="author.id" :value="String(author.id)">
              {{ author.full_name }}
            </option>
          </select>
        </div>
        <div class="col-12 col-md-3 d-flex gap-2">
          <button class="btn btn-primary" type="submit">Найти</button>
          <button class="btn btn-outline-secondary" type="button" @click="resetFilters">Сбросить</button>
        </div>
      </div>
      <p v-if="authorsLoading" class="text-secondary small mt-3 mb-0">Загрузка авторов…</p>
      <div v-if="authorsError" class="text-danger small mt-3" role="alert">
        Не удалось загрузить список авторов.
        <button class="btn btn-link btn-sm p-0 align-baseline" type="button" @click="loadAuthors">Повторить</button>
      </div>
    </form>

    <div v-if="loading" class="text-secondary" role="status">Загрузка книг…</div>
    <div v-else-if="booksError" class="alert alert-danger" role="alert">
      Не удалось загрузить книги. Проверьте подключение к API.
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadBooks">Повторить</button>
    </div>
    <div v-else-if="books.length === 0" class="alert alert-light border">Книги не найдены.</div>
    <template v-else>
      <p class="text-secondary small" aria-live="polite">
        Показано {{ firstItem }}–{{ lastItem }} из {{ pagination.total }}
      </p>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
        <div v-for="book in books" :key="book.id" class="col">
          <BookCard :book="book" />
        </div>
      </div>
      <nav v-if="totalPages > 1" class="d-flex align-items-center justify-content-center gap-3 mt-4" aria-label="Страницы каталога">
        <button class="btn btn-outline-primary" type="button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
          Назад
        </button>
        <span>Страница {{ currentPage }} из {{ totalPages }}</span>
        <button class="btn btn-outline-primary" type="button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">
          Вперёд
        </button>
      </nav>
    </template>
  </main>
</template>
