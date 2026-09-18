const storageKey = 'book-catalog-auth'

export function isValidSession(session) {
  return typeof session?.token === 'string' && session.token.length > 0 &&
    typeof session.expires_at === 'string' && Date.parse(session.expires_at) > Date.now() &&
    Number.isInteger(session.user?.id) && typeof session.user.username === 'string' &&
    session.user.role === 'user'
}

export function readSession() {
  if (typeof localStorage === 'undefined') return { session: null, invalid: false }

  const stored = localStorage.getItem(storageKey)
  if (stored === null) return { session: null, invalid: false }

  let session = null
  try {
    session = JSON.parse(stored)
  } catch {
    session = null
  }

  if (isValidSession(session)) return { session, invalid: false }

  localStorage.removeItem(storageKey)
  return { session: null, invalid: true }
}

export function saveSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearSession() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey)
}
