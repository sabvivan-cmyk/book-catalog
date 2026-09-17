<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAuthor } from '../services/api/authors'

const route = useRoute()
const author = ref(null)
const loading = ref(false)
const notFound = ref(false)
const error = ref(false)
let requestNumber = 0

function validId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function loadAuthor() {
  const request = ++requestNumber
  const id = route.params.id
  author.value = null
  notFound.value = false
  error.value = false

  if (!validId(id)) {
    loading.value = false
    notFound.value = true
    return
  }

  loading.value = true
  try {
    const data = await getAuthor(id)
    if (request === requestNumber) author.value = data
  } catch (caught) {
    if (request !== requestNumber) return
    if (caught.response?.status === 404) notFound.value = true
    else error.value = true
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

watch(() => route.params.id, loadAuthor, { immediate: true })
</script>

<template>
  <main class="container py-4 py-md-5">
    <RouterLink :to="{ name: 'books', query: route.query }" class="d-inline-block mb-4">
      ← К каталогу
    </RouterLink>

    <div v-if="loading" class="text-secondary" role="status">Загрузка автора…</div>
    <div v-else-if="notFound" class="alert alert-light border" role="status">Автор не найден.</div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      Не удалось загрузить автора.
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadAuthor">Повторить</button>
    </div>
    <template v-else-if="author">
      <h1 class="mb-4">{{ author.full_name }}</h1>
      <h2 class="h4 mb-3">Книги автора</h2>
      <div v-if="!author.books?.length" class="alert alert-light border">Книг пока нет.</div>
      <ul v-else class="list-group">
        <li v-for="book in author.books" :key="book.id" class="list-group-item d-flex flex-wrap justify-content-between gap-2">
          <RouterLink :to="{ name: 'book', params: { id: book.id }, query: route.query }">{{ book.title }}</RouterLink>
          <span class="text-secondary">{{ book.year ?? '—' }}</span>
        </li>
      </ul>
    </template>
  </main>
</template>
