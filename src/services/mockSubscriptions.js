import { useMockApi } from './api/config'

export const mockSubscriptionsEnabled = useMockApi

export async function hasMockSubscriptionForAuthor(authorId) {
  if (!mockSubscriptionsEnabled) return false
  return import('./mock/subscriptionsApi').then((mock) => mock.hasSubscriptionForAuthor(authorId))
}

export async function subscribeToAuthor(authorId, phone) {
  if (!mockSubscriptionsEnabled) throw new Error('Подписка недоступна без backend API')
  return import('./mock/subscriptionsApi').then((mock) => mock.createSubscription(authorId, phone))
}
