import { authors } from './data'
import { delay, mockError, notFound } from './common'
import { isValidPhone, normalizePhone } from '../subscriptionPhone'

export const subscriptions = []

export function hasSubscriptionForAuthor(authorId) {
  return subscriptions.some((item) => item.author_id === Number(authorId))
}

export async function createSubscription(authorId, rawPhone) {
  await delay()
  const id = Number(authorId)
  if (!authors.some((author) => author.id === id)) throw notFound('Автор не найден')
  if (!isValidPhone(rawPhone)) {
    throw mockError(422, [{ field: 'phone', message: 'Укажите телефон в международном формате' }])
  }

  const phone = normalizePhone(rawPhone)
  const exists = subscriptions.some((item) => item.author_id === id && item.phone === phone)
  if (!exists) subscriptions.push({ author_id: id, phone })
  return { success: true, created: !exists }
}

export function removeSubscriptionsForAuthor(authorId) {
  for (let index = subscriptions.length - 1; index >= 0; index -= 1) {
    if (subscriptions[index].author_id === authorId) subscriptions.splice(index, 1)
  }
}
