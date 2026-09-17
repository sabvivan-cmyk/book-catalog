import api from './client'

export async function getBooks({ page = 1, perPage = 20, authorId, year, search } = {}) {
  const params = { page, 'per-page': perPage }

  if (authorId != null && authorId !== '') params.author_id = authorId
  if (year != null && year !== '') params.year = year
  if (search) params.search = search

  const response = await api.get('/books', { params })
  const result = response.data

  if (result?.success !== true || !Array.isArray(result.data?.items) || !result.data?.pagination) {
    throw new Error('Некорректный ответ API каталога книг')
  }

  return result.data
}

export async function getBook(id) {
  const response = await api.get(`/books/${id}`)
  const result = response.data

  if (result?.success !== true || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    throw new Error('Некорректный ответ API книги')
  }

  return result.data
}
