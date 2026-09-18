import { authors, books } from './data'
import { useAuthStore } from '../../stores/auth'
import { delay, mockError, notFound, paginate } from './common'
import { clearNotificationResult, notifySubscribersForBook } from './bookNotifications'

let nextBookId = Math.max(0, ...books.map((book) => book.id)) + 1
const coverUrls = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return
    for (const url of coverUrls) URL.revokeObjectURL(url)
    coverUrls.clear()
  })
}

export async function getBooks(params = {}) {
  await delay()

  const { page = 1, 'per-page': perPage = 20, author_id: authorId, year, search } = params
  const searchText = String(search || '').trim().toLocaleLowerCase('ru')
  const items = books.filter((book) =>
    (!searchText || book.title.toLocaleLowerCase('ru').includes(searchText)) &&
    (year == null || book.year === Number(year)) &&
    (authorId == null || book.authors.some((author) => author.id === Number(authorId))),
  )

  return { success: true, data: paginate(items, page, perPage) }
}

export async function getBook(id) {
  await delay()
  const book = books.find((item) => item.id === Number(id))
  if (!book) throw notFound('Книга не найдена')
  return { success: true, data: book }
}

export async function createBook(formData) {
  await delay()
  if (!useAuthStore().validToken()) {
    throw mockError(401, [{ field: 'auth', message: 'Требуется вход' }])
  }

  const title = String(formData.get('title') || '').trim()
  const yearText = formData.get('year')
  const year = Number(yearText)
  const authorIds = [...new Set(formData.getAll('author_ids').map(Number))]
  const cover = formData.get('cover')
  const errors = []
  if (!title) errors.push({ field: 'title', message: 'Укажите название книги' })
  if (yearText === null || yearText === '' || !Number.isSafeInteger(year)) {
    errors.push({ field: 'year', message: 'Укажите целый год выпуска' })
  }
  if (!authorIds.length || authorIds.some((id) => !Number.isSafeInteger(id) || !authors.some((author) => author.id === id))) {
    errors.push({ field: 'author_ids', message: 'Выберите автора из списка' })
  }
  if (!(cover instanceof Blob) || !cover.type.startsWith('image/') || cover.size === 0) {
    errors.push({ field: 'cover', message: 'Выберите изображение обложки' })
  }
  if (errors.length) throw mockError(422, errors)

  const coverUrl = URL.createObjectURL(cover)
  coverUrls.add(coverUrl)
  const book = {
    id: nextBookId++,
    title,
    year,
    description: String(formData.get('description') || ''),
    isbn: String(formData.get('isbn') || ''),
    cover_url: coverUrl,
    authors: authors.filter((author) => authorIds.includes(author.id)),
  }
  books.push(book)
  await notifySubscribersForBook(book)
  return { success: true, data: book }
}

export async function updateBook(id, body) {
  await delay()
  if (!useAuthStore().validToken()) throw mockError(401, [{ field: 'auth', message: 'Требуется вход' }])
  const book = books.find((item) => item.id === Number(id))
  if (!book) throw notFound('Книга не найдена')

  const errors = []
  if ('title' in body && (typeof body.title !== 'string' || !body.title.trim())) {
    errors.push({ field: 'title', message: 'Укажите название книги' })
  }
  if ('year' in body && !Number.isSafeInteger(body.year)) {
    errors.push({ field: 'year', message: 'Укажите целый год выпуска' })
  }
  if ('description' in body && typeof body.description !== 'string') {
    errors.push({ field: 'description', message: 'Описание должно быть строкой' })
  }
  if ('isbn' in body && typeof body.isbn !== 'string') {
    errors.push({ field: 'isbn', message: 'ISBN должен быть строкой' })
  }
  if ('author_ids' in body && (!Array.isArray(body.author_ids) || !body.author_ids.length ||
    body.author_ids.some((authorId) => !Number.isSafeInteger(authorId) || !authors.some((author) => author.id === authorId)))) {
    errors.push({ field: 'author_ids', message: 'Выберите автора из списка' })
  }
  if (errors.length) throw mockError(422, errors)

  if ('title' in body) book.title = body.title.trim()
  if ('year' in body) book.year = body.year
  if ('description' in body) book.description = body.description
  if ('isbn' in body) book.isbn = body.isbn
  if ('author_ids' in body) book.authors = authors.filter((author) => body.author_ids.includes(author.id))
  return { success: true, data: book }
}

export async function deleteBook(id) {
  await delay()
  if (!useAuthStore().validToken()) throw mockError(401, [{ field: 'auth', message: 'Требуется вход' }])
  const index = books.findIndex((item) => item.id === Number(id))
  if (index === -1) throw notFound('Книга не найдена')
  const [book] = books.splice(index, 1)
  clearNotificationResult(book.id)
  if (coverUrls.delete(book.cover_url)) URL.revokeObjectURL(book.cover_url)
}
