<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTopAuthors } from '../services/api/reports'

const route = useRoute()
const router = useRouter()
const yearInput = ref('')
const report = ref(null)
const loading = ref(false)
const error = ref(false)
const validationError = ref('')
let requestNumber = 0

function parseYear(value) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
  if (!/^-?\d+$/.test(text)) return null
  const year = Number(text)
  return Number.isSafeInteger(year) ? year : null
}

async function loadReport(year) {
  const request = ++requestNumber
  loading.value = true
  error.value = false
  report.value = null
  try {
    const data = await getTopAuthors(year)
    if (request === requestNumber) report.value = data
  } catch {
    if (request === requestNumber) error.value = true
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

function submitYear() {
  validationError.value = ''
  const year = parseYear(yearInput.value)
  if (year === null) {
    validationError.value = 'Укажите целый год.'
    return
  }
  if (route.query.year === String(year)) loadReport(year)
  else router.push({ name: 'top-authors', query: { year: String(year) } })
}

watch(() => route.query.year, (value) => {
  if (value === undefined) {
    router.replace({ name: 'top-authors', query: { year: String(new Date().getFullYear()) } })
    return
  }
  const text = typeof value === 'string' ? value : ''
  yearInput.value = text
  validationError.value = ''
  const year = parseYear(text)
  if (year === null) {
    ++requestNumber
    loading.value = false
    report.value = null
    error.value = false
    validationError.value = 'Укажите целый год.'
    return
  }
  loadReport(year)
}, { immediate: true })
</script>

<template>
  <main class="container py-4 py-md-5">
    <h1 class="mb-4">ТОП авторов</h1>
    <form class="card card-body mb-4" novalidate @submit.prevent="submitYear">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-sm-5 col-md-3">
          <label for="report-year" class="form-label">Год выпуска книг</label>
          <input id="report-year" v-model="yearInput" class="form-control" :class="{ 'is-invalid': validationError }" type="number" step="1" name="year" required />
          <div v-if="validationError" class="invalid-feedback">{{ validationError }}</div>
        </div>
        <div class="col-12 col-sm-auto">
          <button class="btn btn-primary" type="submit">Показать</button>
        </div>
      </div>
    </form>

    <div v-if="loading" class="text-secondary" role="status">Загрузка отчёта…</div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      Не удалось загрузить отчёт.
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="loadReport(parseYear(route.query.year))">Повторить</button>
    </div>
    <div v-else-if="validationError" class="alert alert-light border" role="status">Выберите корректный год, чтобы увидеть отчёт.</div>
    <div v-else-if="report && report.items.length === 0" class="alert alert-light border">За {{ report.year }} год данные не найдены.</div>
    <template v-else-if="report">
      <h2 class="h4 mb-3">{{ report.year }} год</h2>
      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead><tr><th scope="col">Место</th><th scope="col">Автор</th><th scope="col">Книг</th></tr></thead>
          <tbody>
            <tr v-for="author in report.items" :key="author.author_id">
              <td>{{ author.rank }}</td>
              <td>
                <RouterLink v-if="author.author_id != null" :to="{ name: 'author', params: { id: author.author_id } }">{{ author.full_name }}</RouterLink>
                <span v-else>{{ author.full_name }}</span>
              </td>
              <td>{{ author.books_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>
</template>
