export function delay() {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export function paginate(items, page, perPage) {
  const currentPage = Number(page)
  const pageSize = Number(perPage)
  const total = items.length

  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pagination: {
      total,
      page: currentPage,
      per_page: pageSize,
      total_pages: Math.ceil(total / pageSize),
    },
  }
}

export function notFound(message) {
  const error = new Error(message)
  error.response = {
    status: 404,
    data: { success: false, errors: [{ field: 'id', message }] },
  }
  return error
}

export function mockError(status, errors) {
  const error = new Error(errors[0]?.message || 'Ошибка API')
  error.response = { status, data: { success: false, errors } }
  return error
}
