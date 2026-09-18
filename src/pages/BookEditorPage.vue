<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookCover from '../components/BookCover.vue'
import { getAuthors } from '../services/api/authors'
import { createBook, getBook, updateBook } from '../services/api/books'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'book-edit')
const title = ref('')
const year = ref('')
const description = ref('')
const isbn = ref('')
const selectedAuthorIds = ref([])
const cover = shallowRef(null)
const previewUrl = ref('')
const authors = ref([])
const authorsLoading = ref(false)
const authorsError = ref(false)
const submitting = ref(false)
const fieldErrors = ref({})
const formError = ref('')
const needsLogin = ref(false)
const bookLoading = ref(false)
const notFound = ref(false)
const loadError = ref(false)
const currentCoverUrl = ref('')
let requestNumber = 0

function validId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function loadBookForEdit() {
  const request = ++requestNumber
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  cover.value = null
  title.value = ''
  year.value = ''
  description.value = ''
  isbn.value = ''
  selectedAuthorIds.value = []
  currentCoverUrl.value = ''
  fieldErrors.value = {}
  formError.value = ''
  needsLogin.value = false
  loadError.value = false
  notFound.value = false
  if (!isEdit.value) {
    bookLoading.value = false
    return
  }
  if (!validId(route.params.id)) {
    bookLoading.value = false
    notFound.value = true
    return
  }
  bookLoading.value = true
  try {
    const book = await getBook(route.params.id)
    if (request !== requestNumber) return
    title.value = book.title || ''
    year.value = book.year == null ? '' : String(book.year)
    description.value = book.description || ''
    isbn.value = book.isbn || ''
    selectedAuthorIds.value = (book.authors || []).map((author) => author.id)
    currentCoverUrl.value = book.cover_url || ''
  } catch (error) {
    if (request !== requestNumber) return
    if (error.response?.status === 404) notFound.value = true
    else loadError.value = true
  } finally {
    if (request === requestNumber) bookLoading.value = false
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
    authors.value = []
    authorsError.value = true
  } finally {
    authorsLoading.value = false
  }
}

function selectCover(event) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  cover.value = event.target.files?.[0] || null
  previewUrl.value = cover.value ? URL.createObjectURL(cover.value) : ''
  fieldErrors.value.cover = ''
}

function validate() {
  const errors = {}
  if (!title.value.trim()) errors.title = 'Укажите название книги.'
  if (year.value === '' || !Number.isSafeInteger(Number(year.value))) errors.year = 'Укажите целый год выпуска.'
  if (selectedAuthorIds.value.length === 0) errors.author_ids = 'Выберите хотя бы одного автора.'
  if (!isEdit.value && (!cover.value || !cover.value.type.startsWith('image/') || cover.value.size === 0)) {
    errors.cover = 'Выберите изображение обложки.'
  }
  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function applyServerErrors(error) {
  const errors = error.response?.data?.errors
  if (!Array.isArray(errors) || errors.length === 0) {
    formError.value = 'Не удалось сохранить книгу. Проверьте данные.'
    return
  }
  const fields = new Set(['title', 'year', 'description', 'isbn', 'author_ids'])
  if (!isEdit.value) fields.add('cover')
  const general = []
  for (const item of errors) {
    if (typeof item?.message !== 'string') continue
    if (fields.has(item.field)) {
      fieldErrors.value[item.field] = [fieldErrors.value[item.field], item.message].filter(Boolean).join(' ')
    } else {
      general.push(item.message)
    }
  }
  formError.value = general.join(' ')
}

async function submit() {
  if (submitting.value || bookLoading.value || authorsLoading.value || authorsError.value) return
  formError.value = ''
  needsLogin.value = false
  if (!validate()) return

  submitting.value = true
  try {
    let book
    if (isEdit.value) {
      book = await updateBook(route.params.id, {
        title: title.value.trim(),
        year: Number(year.value),
        description: description.value.trim(),
        isbn: isbn.value.trim(),
        author_ids: selectedAuthorIds.value,
      })
    } else {
      const formData = new FormData()
      formData.append('title', title.value.trim())
      formData.append('year', String(Number(year.value)))
      if (description.value.trim()) formData.append('description', description.value.trim())
      if (isbn.value.trim()) formData.append('isbn', isbn.value.trim())
      for (const id of selectedAuthorIds.value) formData.append('author_ids', String(id))
      formData.append('cover', cover.value)
      book = await createBook(formData)
    }
    await router.replace({ name: 'book', params: { id: book.id }, query: route.query })
  } catch (error) {
    const status = error.response?.status
    if (status === 422) applyServerErrors(error)
    else if (status === 401) {
      formError.value = 'Сессия завершилась. Войдите снова.'
      needsLogin.value = true
    } else if (status === 403) formError.value = 'Недостаточно прав для сохранения книги.'
    else if (status === 404 && isEdit.value) notFound.value = true
    else formError.value = 'Не удалось сохранить книгу. Попробуйте ещё раз.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadAuthors)
watch(() => [route.name, route.params.id], loadBookForEdit, { immediate: true })
onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <main class="container py-4 py-md-5">
    <RouterLink :to="{ name: 'books', query: route.query }" class="d-inline-block mb-4">← К каталогу</RouterLink>
    <h1 class="mb-4">{{ isEdit ? 'Редактировать книгу' : 'Добавить книгу' }}</h1>
    <div v-if="bookLoading" class="text-secondary" role="status">Загрузка книги…</div>
    <div v-else-if="notFound" class="alert alert-light border" role="status">Книга не найдена.</div>
    <div v-else-if="loadError" class="alert alert-danger" role="alert">
      Не удалось загрузить книгу.
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadBookForEdit">Повторить</button>
    </div>
    <form v-else class="card card-body book-form" novalidate @submit.prevent="submit">
      <div class="mb-3">
        <label for="new-book-title" class="form-label">Название</label>
        <input id="new-book-title" v-model="title" class="form-control" :class="{ 'is-invalid': fieldErrors.title }" type="text" name="title" required :disabled="submitting" />
        <div v-if="fieldErrors.title" class="invalid-feedback">{{ fieldErrors.title }}</div>
      </div>

      <div class="mb-3">
        <label for="new-book-year" class="form-label">Год выпуска</label>
        <input id="new-book-year" v-model="year" class="form-control" :class="{ 'is-invalid': fieldErrors.year }" type="number" step="1" name="year" required :disabled="submitting" />
        <div v-if="fieldErrors.year" class="invalid-feedback">{{ fieldErrors.year }}</div>
      </div>

      <div class="mb-3">
        <label for="new-book-description" class="form-label">Описание</label>
        <textarea id="new-book-description" v-model="description" class="form-control" :class="{ 'is-invalid': fieldErrors.description }" name="description" rows="4" :disabled="submitting" />
        <div v-if="fieldErrors.description" class="invalid-feedback">{{ fieldErrors.description }}</div>
      </div>

      <div class="mb-3">
        <label for="new-book-isbn" class="form-label">ISBN</label>
        <input id="new-book-isbn" v-model="isbn" class="form-control" :class="{ 'is-invalid': fieldErrors.isbn }" type="text" name="isbn" :disabled="submitting" />
        <div v-if="fieldErrors.isbn" class="invalid-feedback">{{ fieldErrors.isbn }}</div>
      </div>

      <fieldset class="mb-3" :disabled="submitting || authorsLoading">
        <legend class="form-label fs-6">Авторы</legend>
        <p v-if="authorsLoading" class="text-secondary small">Загрузка авторов…</p>
        <div v-else-if="authorsError" class="text-danger small" role="alert">
          Не удалось загрузить авторов.
          <button class="btn btn-link btn-sm p-0 align-baseline" type="button" @click="loadAuthors">Повторить</button>
        </div>
        <p v-else-if="authors.length === 0" class="text-secondary small">Авторы не найдены.</p>
        <div v-else class="book-author-options border rounded p-3">
          <div v-for="author in authors" :key="author.id" class="form-check">
            <input :id="`new-book-author-${author.id}`" v-model="selectedAuthorIds" class="form-check-input" type="checkbox" :value="author.id" />
            <label class="form-check-label" :for="`new-book-author-${author.id}`">{{ author.full_name }}</label>
          </div>
        </div>
        <div v-if="fieldErrors.author_ids" class="text-danger small mt-1" role="alert">{{ fieldErrors.author_ids }}</div>
      </fieldset>

      <div v-if="isEdit" class="mb-3">
        <p class="form-label">Текущая обложка</p>
        <BookCover :key="currentCoverUrl" :cover-url="currentCoverUrl" :title="title" class="book-cover--edit rounded" />
        <p class="form-text">Замена обложки при редактировании недоступна.</p>
      </div>
      <div v-else class="mb-3">
        <label for="new-book-cover" class="form-label">Обложка</label>
        <input id="new-book-cover" class="form-control" :class="{ 'is-invalid': fieldErrors.cover }" type="file" name="cover" accept="image/*" required :disabled="submitting" @change="selectCover" />
        <div v-if="fieldErrors.cover" class="invalid-feedback">{{ fieldErrors.cover }}</div>
        <img v-if="previewUrl" :src="previewUrl" alt="Предпросмотр выбранной обложки" class="book-cover-preview img-thumbnail mt-3" />
      </div>

      <div v-if="formError" class="alert alert-danger" role="alert">
        {{ formError }}
        <RouterLink v-if="needsLogin" :to="{ name: 'login', query: { redirect: route.fullPath } }" class="alert-link">Войти</RouterLink>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-primary" type="submit" :disabled="submitting || authorsLoading || authorsError">
          {{ submitting ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить книгу' }}
        </button>
        <RouterLink class="btn btn-outline-secondary" :to="isEdit ? { name: 'book', params: { id: route.params.id }, query: route.query } : { name: 'books', query: route.query }">Отмена</RouterLink>
      </div>
    </form>
  </main>
</template>
