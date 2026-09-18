import { authors, books } from './data'
import { delay, notFound, paginate } from './common'

export async function getAuthors(params = {}) {
  await delay()

  const { page = 1, 'per-page': perPage = 20, search } = params
  const searchText = String(search || '').trim().toLocaleLowerCase('ru')
  const items = authors.filter((author) => !searchText || author.full_name.toLocaleLowerCase('ru').includes(searchText))

  return { success: true, data: paginate(items, page, perPage) }
}

export async function getAuthor(id) {
  await delay()
  const author = authors.find((item) => item.id === Number(id))
  if (!author) throw notFound('Автор не найден')

  return {
    success: true,
    data: {
      ...author,
      books: books
        .filter((book) => book.authors.some((item) => item.id === author.id))
        .map((book) => ({ id: book.id, title: book.title, year: book.year })),
    },
  }
}
