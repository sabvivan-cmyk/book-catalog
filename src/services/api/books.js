import api from './client'
import { useMockApi } from './config'

export async function getBooks({ page = 1, perPage = 20, authorId, year, search } = {}) {
  const params = { page, 'per-page': perPage }

  if (authorId != null && authorId !== '') params.author_id = authorId
  if (year != null && year !== '') params.year = year
  if (search) params.search = search

  const result = useMockApi
    ? await import('../mock/booksApi').then((mock) => mock.getBooks(params))
    : (await api.get('/books', { params })).data

  if (result?.success !== true || !Array.isArray(result.data?.items) || !result.data?.pagination) {
    throw new Error('Некорректный ответ API каталога книг')
  }

  return result.data
}

export async function getBook(id) {
  const result = useMockApi
    ? await import('../mock/booksApi').then((mock) => mock.getBook(id))
    : (await api.get(`/books/${id}`)).data

  if (result?.success !== true || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    throw new Error('Некорректный ответ API книги')
  }

  return result.data
}

export async function createBook(formData) {
  const result = useMockApi
    ? await import('../mock/booksApi').then((mock) => mock.createBook(formData))
    : (await api.post('/books', formData)).data

  if (result?.success !== true || !Number.isInteger(result.data?.id)) {
    throw new Error('Некорректный ответ API создания книги')
  }

  return result.data
}

export async function updateBook(id, values) {
  const body = {
    title: values.title,
    year: values.year,
    description: values.description,
    isbn: values.isbn,
    author_ids: values.author_ids,
  }
  const result = useMockApi
    ? await import('../mock/booksApi').then((mock) => mock.updateBook(id, body))
    : (await api.patch(`/books/${id}`, body)).data

  if (result?.success !== true || !Number.isInteger(result.data?.id)) {
    throw new Error('Некорректный ответ API обновления книги')
  }
  return result.data
}

export async function deleteBook(id) {
  if (useMockApi) await import('../mock/booksApi').then((mock) => mock.deleteBook(id))
  else await api.delete(`/books/${id}`)
}
