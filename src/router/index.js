import { createRouter, createWebHistory } from 'vue-router'
import BooksPage from '../pages/BooksPage.vue'
import BookPage from '../pages/BookPage.vue'
import CreateBookPage from '../pages/CreateBookPage.vue'
import AuthorPage from '../pages/AuthorPage.vue'
import AuthorsPage from '../pages/AuthorsPage.vue'
import AuthorEditorPage from '../pages/AuthorEditorPage.vue'
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
      path: '/books/new',
      name: 'book-create',
      component: CreateBookPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/books/:id',
      name: 'book',
      component: BookPage,
    },
    {
      path: '/authors',
      name: 'authors',
      component: AuthorsPage,
    },
    {
      path: '/authors/new',
      name: 'author-create',
      component: AuthorEditorPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/authors/:id/edit',
      name: 'author-edit',
      component: AuthorEditorPage,
      meta: { requiresAuth: true },
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
