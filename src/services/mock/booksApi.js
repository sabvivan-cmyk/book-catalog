import { authors, books } from './data'
import { useAuthStore } from '../../stores/auth'
import { delay, mockError, notFound, paginate } from './common'

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
  return { success: true, data: book }
}
