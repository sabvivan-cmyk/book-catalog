<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createAuthor, getAuthor, updateAuthor } from '../services/api/authors'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'author-edit')
const fullName = ref('')
const loading = ref(false)
const saving = ref(false)
const notFound = ref(false)
const loadError = ref('')
const fieldError = ref('')
const formError = ref('')
const needsLogin = ref(false)
let requestNumber = 0

function validId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function load() {
  const request = ++requestNumber
  fullName.value = ''
  fieldError.value = ''
  formError.value = ''
  needsLogin.value = false
  loadError.value = ''
  notFound.value = false
  if (!isEdit.value) {
    loading.value = false
    return
  }
  if (!validId(route.params.id)) {
    notFound.value = true
    loading.value = false
    return
  }
  loading.value = true
  try {
    const author = await getAuthor(route.params.id)
    if (request === requestNumber) fullName.value = author.full_name
  } catch (caught) {
    if (request !== requestNumber) return
    if (caught.response?.status === 404) notFound.value = true
    else loadError.value = 'Не удалось загрузить автора.'
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

function applyValidationErrors(caught) {
  const errors = caught.response?.data?.errors
  if (!Array.isArray(errors) || errors.length === 0) {
    formError.value = 'Не удалось сохранить автора. Проверьте данные.'
    return
  }
  const general = []
  for (const error of errors) {
    if (typeof error?.message !== 'string') continue
    if (error.field === 'full_name') fieldError.value = [fieldError.value, error.message].filter(Boolean).join(' ')
    else general.push(error.message)
  }
  formError.value = general.join(' ')
}

async function submit() {
  if (saving.value || loading.value) return
  fieldError.value = ''
  formError.value = ''
  needsLogin.value = false
  const name = fullName.value.trim()
  if (!name) {
    fieldError.value = 'Укажите ФИО автора.'
    return
  }
  saving.value = true
  try {
    const author = isEdit.value
      ? await updateAuthor(route.params.id, name)
      : await createAuthor(name)
    await router.replace({ name: 'author', params: { id: author.id } })
  } catch (caught) {
    const status = caught.response?.status
    if (status === 422) applyValidationErrors(caught)
    else if (status === 401) {
      formError.value = 'Сессия завершилась. Войдите снова.'
      needsLogin.value = true
    }
    else if (status === 403) formError.value = 'Недостаточно прав для сохранения автора.'
    else if (status === 404) notFound.value = true
    else formError.value = 'Не удалось сохранить автора. Попробуйте ещё раз.'
  } finally {
    saving.value = false
  }
}

watch(() => [route.name, route.params.id], load, { immediate: true })
</script>

<template>
  <main class="container py-4 py-md-5">
    <RouterLink :to="{ name: 'authors' }" class="d-inline-block mb-4">← К списку авторов</RouterLink>
    <h1 class="mb-4">{{ isEdit ? 'Редактировать автора' : 'Добавить автора' }}</h1>
    <div v-if="loading" class="text-secondary" role="status">Загрузка автора…</div>
    <div v-else-if="notFound" class="alert alert-light border" role="status">Автор не найден.</div>
    <div v-else-if="loadError" class="alert alert-danger" role="alert">
      {{ loadError }}
      <button class="btn btn-outline-danger btn-sm ms-2" type="button" @click="load">Повторить</button>
    </div>
    <form v-else class="card card-body author-form" @submit.prevent="submit">
      <div class="mb-3">
        <label for="author-full-name" class="form-label">ФИО автора</label>
        <input id="author-full-name" v-model="fullName" class="form-control" :class="{ 'is-invalid': fieldError }"
          name="full_name" autocomplete="name" required :disabled="saving" :aria-invalid="Boolean(fieldError)" />
        <div v-if="fieldError" class="invalid-feedback">{{ fieldError }}</div>
      </div>
      <div v-if="formError" class="alert alert-danger" role="alert">
        {{ formError }}
        <RouterLink v-if="needsLogin" :to="{ name: 'login', query: { redirect: route.fullPath } }" class="alert-link">Войти</RouterLink>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
        <RouterLink class="btn btn-outline-secondary" :to="isEdit ? { name: 'author', params: { id: route.params.id } } : { name: 'authors' }">Отмена</RouterLink>
      </div>
    </form>
  </main>
</template>
