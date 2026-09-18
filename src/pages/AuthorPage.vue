<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAuthor } from '../services/api/authors'
import { useAuthStore } from '../stores/auth'
import { hasMockSubscriptionForAuthor, mockSubscriptionsEnabled, subscribeToAuthor } from '../services/mockSubscriptions'
import { isValidPhone } from '../services/subscriptionPhone'

const route = useRoute()
const auth = useAuthStore()
const author = ref(null)
const loading = ref(false)
const notFound = ref(false)
const error = ref(false)
const subscriptionOpen = ref(false)
const isSubscribed = ref(false)
const phone = ref('')
const phoneError = ref('')
const subscriptionError = ref('')
const submitting = ref(false)
let requestNumber = 0
let subscriptionRequestNumber = 0

function clearSubscriptionForm() {
  ++subscriptionRequestNumber
  subscriptionOpen.value = false
  phone.value = ''
  phoneError.value = ''
  subscriptionError.value = ''
  submitting.value = false
}

function resetSubscription() {
  clearSubscriptionForm()
  isSubscribed.value = false
}

function openSubscription() {
  subscriptionOpen.value = true
  subscriptionError.value = ''
}

function cancelSubscription() {
  if (!submitting.value) clearSubscriptionForm()
}

async function submitSubscription() {
  if (submitting.value) return
  phoneError.value = ''
  subscriptionError.value = ''
  if (!isValidPhone(phone.value)) {
    phoneError.value = 'Укажите телефон в международном формате, например +79991234567.'
    return
  }

  const request = ++subscriptionRequestNumber
  submitting.value = true
  try {
    const result = await subscribeToAuthor(author.value.id, phone.value)
    if (request !== subscriptionRequestNumber) return
    if (result?.success !== true) throw new Error('Некорректный ответ mock подписки')
    phone.value = ''
    subscriptionOpen.value = false
    isSubscribed.value = true
  } catch (caught) {
    if (request !== subscriptionRequestNumber) return
    const status = caught.response?.status
    if (status === 422) {
      const errors = caught.response?.data?.errors
      phoneError.value = errors?.find((item) => item.field === 'phone')?.message || 'Проверьте номер телефона.'
    } else if (status === 404) {
      author.value = null
      notFound.value = true
    } else subscriptionError.value = 'Не удалось оформить демонстрационную подписку. Попробуйте ещё раз.'
  } finally {
    if (request === subscriptionRequestNumber) submitting.value = false
  }
}

function validId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function loadAuthor() {
  const request = ++requestNumber
  resetSubscription()
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
    const [data, subscribed] = await Promise.all([getAuthor(id), hasMockSubscriptionForAuthor(id)])
    if (request === requestNumber) {
      author.value = data
      isSubscribed.value = subscribed
    }
  } catch (caught) {
    if (request !== requestNumber) return
    if (caught.response?.status === 404) notFound.value = true
    else error.value = true
  } finally {
    if (request === requestNumber) loading.value = false
  }
}

watch(() => route.params.id, loadAuthor, { immediate: true })
watch(() => auth.isAuthenticated, async (signedIn) => {
  if (signedIn) {
    clearSubscriptionForm()
  } else if (author.value && mockSubscriptionsEnabled) {
    const id = author.value.id
    const subscribed = await hasMockSubscriptionForAuthor(id)
    if (author.value?.id === id && !auth.isAuthenticated) isSubscribed.value = subscribed
  }
})
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
      <section v-if="mockSubscriptionsEnabled && !auth.isAuthenticated" class="card card-body mt-4" aria-label="Демонстрационная подписка">
        <div v-if="isSubscribed" class="alert alert-success mb-0" role="status">
          Вы подписаны на новые книги этого автора. Подписка действует в деморежиме, SMS не отправляется.
        </div>
        <button v-else-if="!subscriptionOpen" class="btn btn-outline-primary align-self-start" type="button" @click="openSubscription">
          Подписаться на новые книги
        </button>
        <form v-else novalidate @submit.prevent="submitSubscription">
          <label for="subscription-phone" class="form-label">Телефон</label>
          <input id="subscription-phone" v-model="phone" class="form-control" :class="{ 'is-invalid': phoneError }"
            type="tel" inputmode="tel" autocomplete="off" placeholder="+79991234567" required
            :disabled="submitting" :aria-invalid="Boolean(phoneError)" aria-describedby="subscription-phone-error" />
          <div v-if="phoneError" id="subscription-phone-error" class="invalid-feedback">{{ phoneError }}</div>
          <div v-if="subscriptionError" class="alert alert-danger mt-3" role="alert">{{ subscriptionError }}</div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="btn btn-primary" type="submit" :disabled="submitting">{{ submitting ? 'Сохранение…' : 'Подписаться' }}</button>
            <button class="btn btn-outline-secondary" type="button" :disabled="submitting" @click="cancelSubscription">Отмена</button>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>
