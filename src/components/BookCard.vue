<script setup>
import { useRoute } from 'vue-router'
import BookCover from './BookCover.vue'

const route = useRoute()

defineProps({
  book: {
    type: Object,
    required: true,
  },
})

</script>

<template>
  <article class="card h-100 book-card">
    <BookCover :cover-url="book.cover_url" :title="book.title" />
    <div class="card-body">
      <h2 class="card-title h5">
        <RouterLink :to="{ name: 'book', params: { id: book.id }, query: route.query }">
          {{ book.title }}
        </RouterLink>
      </h2>
      <p class="card-text mb-2">Год: {{ book.year ?? '—' }}</p>
      <p class="card-text mb-2">ISBN: {{ book.isbn || '—' }}</p>
      <div class="card-text">
        Авторы:
        <template v-if="book.authors?.length">
          <template v-for="(author, index) in book.authors" :key="author.id">
            <span v-if="index">, </span><RouterLink :to="{ name: 'author', params: { id: author.id }, query: route.query }">{{ author.full_name }}</RouterLink>
          </template>
        </template>
        <span v-else>—</span>
      </div>
    </div>
  </article>
</template>
