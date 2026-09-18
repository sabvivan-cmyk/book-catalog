import api from './client'
import { useMockApi } from './config'

export async function getTopAuthors(year) {
  const result = useMockApi
    ? await import('../mock/reportsApi').then((mock) => mock.getTopAuthors({ year }))
    : (await api.get('/reports/top-authors', { params: { year } })).data

  if (result?.success !== true || !Number.isInteger(result.data?.year) || !Array.isArray(result.data?.items)) {
    throw new Error('Некорректный ответ API отчёта')
  }

  return result.data
}
