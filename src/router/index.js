import { createRouter, createWebHistory } from 'vue-router'
import BooksPage from '../pages/BooksPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/books',
    },
    {
      path: '/books',
      name: 'books',
      component: BooksPage,
    },
  ],
})

export default router
