<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookCover from '../components/BookCover.vue'
import { deleteBook, getBook } from '../services/api/books'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const book = ref(null)
const loading = ref(false)
const notFound = ref(false)
const error = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const needsLogin = ref(false)
let requestNumber = 0

function validId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function loadBook() {
  const request = ++requestNumber
  const id = route.params.id
  book.value = null
  notFound.value = false
  error.value = false
  deleteError.value = ''
  needsLogin.value = false

  if (!validId(id)) {
    loading.value = false
    notFound.value = true
    return
  }

  loading.value = true
  try {
    const data = await getBook(id)
    if (request === requestNumber) book.value = data
  } catch (caught) {
    if (request !== requestNumber) return
    if (caught.response?.status === 404) notFound.value = true
    else error.value = true
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

async function removeBook() {
  if (deleting.value || !book.value || !window.confirm(`Удалить книгу «${book.value.title}»?`)) return
  deleting.value = true
  deleteError.value = ''
  needsLogin.value = false
  try {
    await deleteBook(book.value.id)
    await router.replace({ name: 'books', query: route.query })
  } catch (caught) {
    const status = caught.response?.status
    if (status === 401) {
      deleteError.value = 'Сессия завершилась. Войдите снова.'
      needsLogin.value = true
    } else if (status === 403) deleteError.value = 'Недостаточно прав для удаления книги.'
    else if (status === 404) {
      book.value = null
      notFound.value = true
    } else deleteError.value = 'Не удалось удалить книгу. Попробуйте ещё раз.'
  } finally {
    deleting.value = false
  }
}

watch(() => route.params.id, loadBook, { immediate: true })
</script>

<template>
  <main class="container py-4 py-md-5">
    <RouterLink :to="{ name: 'books', query: route.query }" class="d-inline-block mb-4">
      ← К каталогу
    </RouterLink>

    <div v-if="loading" class="text-secondary" role="status">Загрузка книги…</div>
    <div v-else-if="notFound" class="alert alert-light border" role="status">Книга не найдена.</div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      Не удалось загрузить книгу.
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadBook">Повторить</button>
    </div>
    <article v-else-if="book" class="row g-4">
      <div class="col-12 col-md-4">
        <BookCover :key="book.id" :cover-url="book.cover_url" :title="book.title" class="book-cover--detail rounded" />
      </div>
      <div class="col-12 col-md-8">
        <h1 class="mb-4">{{ book.title }}</h1>
        <div v-if="auth.isAuthenticated" class="d-flex flex-wrap gap-2 mb-4">
          <RouterLink class="btn btn-outline-primary btn-sm" :to="{ name: 'book-edit', params: { id: book.id }, query: route.query }">Редактировать</RouterLink>
          <button class="btn btn-outline-danger btn-sm" type="button" :disabled="deleting" @click="removeBook">
            {{ deleting ? 'Удаление…' : 'Удалить' }}
          </button>
        </div>
        <div v-if="deleteError" class="alert alert-danger" role="alert">
          {{ deleteError }}
          <RouterLink v-if="needsLogin" :to="{ name: 'login', query: { redirect: route.fullPath } }" class="alert-link">Войти</RouterLink>
        </div>
        <dl class="row mb-4">
          <dt class="col-sm-3">Год</dt>
          <dd class="col-sm-9">{{ book.year ?? '—' }}</dd>
          <dt class="col-sm-3">ISBN</dt>
          <dd class="col-sm-9">{{ book.isbn || '—' }}</dd>
          <dt class="col-sm-3">Авторы</dt>
          <dd class="col-sm-9">
            <template v-if="book.authors?.length">
              <template v-for="(author, index) in book.authors" :key="author.id">
                <span v-if="index">, </span><RouterLink :to="{ name: 'author', params: { id: author.id }, query: route.query }">{{ author.full_name }}</RouterLink>
              </template>
            </template>
            <span v-else>—</span>
          </dd>
        </dl>
        <h2 class="h5">Описание</h2>
        <p class="book-description">{{ book.description || 'Описание отсутствует.' }}</p>
      </div>
    </article>
  </main>
</template>
