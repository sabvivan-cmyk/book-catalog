<script setup>
import { ref } from 'vue'

defineProps({
  book: {
    type: Object,
    required: true,
  },
})

const coverFailed = ref(false)
</script>

<template>
  <article class="card h-100 book-card">
    <div class="book-card__cover">
      <img
        v-if="book.cover_url && !coverFailed"
        :src="book.cover_url"
        :alt="`Обложка книги «${book.title}»`"
        loading="lazy"
        @error="coverFailed = true"
      />
      <span v-else class="text-secondary">Обложка недоступна</span>
    </div>
    <div class="card-body">
      <h2 class="card-title h5">{{ book.title }}</h2>
      <p class="card-text mb-2">Год: {{ book.year ?? '—' }}</p>
      <p class="card-text mb-2">ISBN: {{ book.isbn || '—' }}</p>
      <p class="card-text mb-0">
        Авторы:
        {{ book.authors?.map((author) => author.full_name).join(', ') || '—' }}
      </p>
    </div>
  </article>
</template>
