import { createRouter, createWebHistory } from 'vue-router'
import BooksPage from '../pages/BooksPage.vue'
import BookPage from '../pages/BookPage.vue'
import AuthorPage from '../pages/AuthorPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import { useAuthStore } from '../stores/auth'

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
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true
  if (useAuthStore().validToken()) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})

export default router
