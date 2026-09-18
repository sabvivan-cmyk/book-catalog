import { books } from './data'
import { delay, mockError } from './common'

export async function getTopAuthors({ year } = {}) {
  await delay()
  if (!Number.isSafeInteger(year)) {
    throw mockError(400, [{ field: 'year', message: 'Укажите целый год' }])
  }

  const counts = new Map()
  for (const book of books) {
    if (book.year !== year) continue
    for (const author of new Map(book.authors.map((item) => [item.id, item])).values()) {
      const previous = counts.get(author.id)
      counts.set(author.id, { author_id: author.id, full_name: author.full_name, books_count: (previous?.books_count || 0) + 1 })
    }
  }

  const items = [...counts.values()]
    .sort((a, b) => b.books_count - a.books_count || a.author_id - b.author_id)
    .slice(0, 10)
    .map((author, index) => ({ rank: index + 1, ...author }))

  return { success: true, data: { year, items } }
}
