import { createRouter, createWebHistory } from 'vue-router'
import BooksPage from '../pages/BooksPage.vue'
import BookPage from '../pages/BookPage.vue'
import AuthorPage from '../pages/AuthorPage.vue'

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
    {
      path: '/books/:id',
      name: 'book',
      component: BookPage,
    },
    {
      path: '/authors/:id',
      name: 'author',
      component: AuthorPage,
    },
  ],
})

export default router
