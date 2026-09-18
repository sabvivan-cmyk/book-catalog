import api from './client'
import { useMockApi } from './config'

export async function getAuthors({ page = 1, perPage = 20, search } = {}) {
  const params = { page, 'per-page': perPage }
  if (search) params.search = search

  const result = useMockApi
    ? await import('../mock/authorsApi').then((mock) => mock.getAuthors(params))
    : (await api.get('/authors', { params })).data

  if (result?.success !== true || !Array.isArray(result.data?.items) || !result.data?.pagination) {
    throw new Error('Некорректный ответ API списка авторов')
  }

  return result.data
}

export async function getAuthor(id) {
  const result = useMockApi
    ? await import('../mock/authorsApi').then((mock) => mock.getAuthor(id))
    : (await api.get(`/authors/${id}`)).data

  if (result?.success !== true || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    throw new Error('Некорректный ответ API автора')
  }

  return result.data
}

function authorFromResponse(result) {
  if (result?.success !== true || !result.data || !Number.isInteger(result.data.id) || typeof result.data.full_name !== 'string') {
    throw new Error('Некорректный ответ API автора')
  }
  return result.data
}

export async function createAuthor(fullName) {
  const body = { full_name: fullName }
  const result = useMockApi
    ? await import('../mock/authorsApi').then((mock) => mock.createAuthor(body))
    : (await api.post('/authors', body)).data
  return authorFromResponse(result)
}

export async function updateAuthor(id, fullName) {
  const body = { full_name: fullName }
  const result = useMockApi
    ? await import('../mock/authorsApi').then((mock) => mock.updateAuthor(id, body))
    : (await api.put(`/authors/${id}`, body)).data
  return authorFromResponse(result)
}

export async function deleteAuthor(id) {
  if (useMockApi) await import('../mock/authorsApi').then((mock) => mock.deleteAuthor(id))
  else await api.delete(`/authors/${id}`)
}
