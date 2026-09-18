import { useMockApi } from './api/config'

export async function takeMockBookNotification(bookId) {
  if (!useMockApi) return null
  return import('./mock/bookNotifications').then((mock) => mock.takeNotificationResult(bookId))
}
