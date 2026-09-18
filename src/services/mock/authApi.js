import { delay } from './common'

export async function login(username, password) {
  await delay()

  if (username !== 'demo' || password !== 'demo') {
    const error = new Error('Неверные учётные данные')
    error.response = {
      status: 401,
      data: { success: false, errors: [{ field: '', message: 'Неверные учётные данные' }] },
    }
    throw error
  }

  return {
    success: true,
    data: {
      token: 'mock-demo-token',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: { id: 1, username: 'demo', role: 'user' },
    },
  }
}
