import { createRouter, createWebHistory } from 'vue-router'
import BooksPage from '../pages/BooksPage.vue'
import BookPage from '../pages/BookPage.vue'
import BookEditorPage from '../pages/BookEditorPage.vue'
import AuthorPage from '../pages/AuthorPage.vue'
import AuthorsPage from '../pages/AuthorsPage.vue'
import AuthorEditorPage from '../pages/AuthorEditorPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import TopAuthorsPage from '../pages/TopAuthorsPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
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
      component: BookEditorPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/books/:id/edit',
      name: 'book-edit',
      component: BookEditorPage,
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
      path: '/reports/top-authors',
      name: 'top-authors',
      component: TopAuthorsPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true
  if (useAuthStore().validToken()) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})

export default router
