import { books } from './data'
import { delay, notFound, paginate } from './common'

export async function getBooks(params = {}) {
  await delay()

  const { page = 1, 'per-page': perPage = 20, author_id: authorId, year, search } = params
  const searchText = String(search || '').trim().toLocaleLowerCase('ru')
  const items = books.filter((book) =>
    (!searchText || book.title.toLocaleLowerCase('ru').includes(searchText)) &&
    (year == null || book.year === Number(year)) &&
    (authorId == null || book.authors.some((author) => author.id === Number(authorId))),
  )

  return { success: true, data: paginate(items, page, perPage) }
}

export async function getBook(id) {
  await delay()
  const book = books.find((item) => item.id === Number(id))
  if (!book) throw notFound('Книга не найдена')
  return { success: true, data: book }
}
