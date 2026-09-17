import api from './client'

export async function getAuthors({ page = 1, perPage = 20, search } = {}) {
  const params = { page, 'per-page': perPage }
  if (search) params.search = search

  const response = await api.get('/authors', { params })
  const result = response.data

  if (result?.success !== true || !Array.isArray(result.data?.items) || !result.data?.pagination) {
    throw new Error('Некорректный ответ API списка авторов')
  }

  return result.data
}
