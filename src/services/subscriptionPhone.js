export function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/[\s()-]/g, '') : ''
}

export function isValidPhone(value) {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(value))
}
