import { phonesForAuthors } from './subscriptionsApi'
import { sendEmulatedSms, SmsPilotError } from './smspilot'

const resultsByBookId = new Map()

export async function notifySubscribersForBook(book) {
  try {
    const phones = phonesForAuthors(book.authors.map((author) => author.id))
    if (phones.length === 0) return

    const message = `Новая книга «${book.title}» появилась в каталоге.`
    const outcomes = await Promise.allSettled(phones.map((phone) => sendEmulatedSms(phone, message)))
    const sent = outcomes.filter((item) => item.status === 'fulfilled').length
    const failure = outcomes.find((item) => item.status === 'rejected')?.reason
    const diagnostic = failure instanceof SmsPilotError ? failure.message : 'SMSPilot emulator: invalid response'
    resultsByBookId.set(book.id, { sent, failed: phones.length - sent, diagnostic: failure ? diagnostic : '' })
  } catch {
    resultsByBookId.set(book.id, { sent: 0, failed: 1, diagnostic: 'SMSPilot emulator: invalid response' })
  }
}

export function takeNotificationResult(bookId) {
  const id = Number(bookId)
  const result = resultsByBookId.get(id) || null
  resultsByBookId.delete(id)
  return result
}

export function clearNotificationResult(bookId) {
  resultsByBookId.delete(Number(bookId))
}
