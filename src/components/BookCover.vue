<script setup>
import { ref } from 'vue'

defineProps({
  coverUrl: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
})

const coverFailed = ref(false)
</script>

<template>
  <div class="book-cover">
    <img
      v-if="coverUrl && !coverFailed"
      :src="coverUrl"
      :alt="`Обложка книги «${title}»`"
      loading="lazy"
      @error="coverFailed = true"
    />
    <span v-else class="text-secondary">Обложка недоступна</span>
  </div>
</template>
