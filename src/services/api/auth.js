import api from './client'
import { useMockApi } from './config'

export async function loginUser(username, password) {
  const result = useMockApi
    ? await import('../mock/authApi').then((mock) => mock.login(username, password))
    : (await api.post('/auth/login', { username, password })).data

  const session = result?.data
  if (result?.success !== true || !session || typeof session !== 'object') {
    throw new Error('Некорректный ответ API авторизации')
  }

  return session
}
