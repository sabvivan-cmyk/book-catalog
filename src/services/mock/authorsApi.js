import { authors, books } from './data'
import { useAuthStore } from '../../stores/auth'
import { delay, mockError, notFound, paginate } from './common'
import { removeSubscriptionsForAuthor } from './subscriptionsApi'

let nextAuthorId = Math.max(0, ...authors.map((author) => author.id)) + 1

function requireUser() {
  if (!useAuthStore().validToken()) {
    throw mockError(401, [{ field: 'auth', message: 'Требуется вход' }])
  }
}

function validateName(body) {
  const name = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
  if (!name) throw mockError(422, [{ field: 'full_name', message: 'Укажите ФИО автора' }])
  return name
}

function authorData(author) {
  return {
    id: author.id,
    full_name: author.full_name,
    books: books
      .filter((book) => book.authors.some((item) => item.id === author.id))
      .map((book) => ({ id: book.id, title: book.title, year: book.year })),
  }
}

export async function getAuthors(params = {}) {
  await delay()

  const { page = 1, 'per-page': perPage = 20, search } = params
  const searchText = String(search || '').trim().toLocaleLowerCase('ru')
  const items = authors.filter((author) => !searchText || author.full_name.toLocaleLowerCase('ru').includes(searchText))

  return { success: true, data: paginate(items, page, perPage) }
}

export async function getAuthor(id) {
  await delay()
  const author = authors.find((item) => item.id === Number(id))
  if (!author) throw notFound('Автор не найден')

  return { success: true, data: authorData(author) }
}

export async function createAuthor(body) {
  await delay()
  requireUser()
  const full_name = validateName(body)
  const id = nextAuthorId++
  const author = { id, full_name }
  authors.push(author)
  return { success: true, data: authorData(author) }
}

export async function updateAuthor(id, body) {
  await delay()
  requireUser()
  const author = authors.find((item) => item.id === Number(id))
  if (!author) throw notFound('Автор не найден')
  author.full_name = validateName(body)
  return { success: true, data: authorData(author) }
}

export async function deleteAuthor(id) {
  await delay()
  requireUser()
  const index = authors.findIndex((item) => item.id === Number(id))
  if (index === -1) throw notFound('Автор не найден')
  const [removed] = authors.splice(index, 1)
  removeSubscriptionsForAuthor(removed.id)
  for (const book of books) {
    const authorIndex = book.authors.findIndex((item) => item.id === removed.id)
    if (authorIndex !== -1) book.authors.splice(authorIndex, 1)
  }
}
