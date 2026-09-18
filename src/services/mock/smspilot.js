const endpoint = '/sms-pilot-emulator'

// Public emulator credential from https://smspilot.ru/apikey.php?tab=api1; not a production secret.
// A production API key belongs on the backend, never in a frontend bundle.
const emulatorKey = 'XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ'

export class SmsPilotError extends Error {
  constructor(category, detail = '') {
    super(`SMSPilot emulator: ${category}${detail ? ` ${detail}` : ''}`)
    this.category = category
    this.detail = detail
  }
}

function safeApiCode(value) {
  return /^\d{1,5}$/.test(String(value)) ? String(value) : ''
}

export async function sendEmulatedSms(phone, message) {
  const body = new URLSearchParams({
    send: message,
    to: phone.replace(/^\+/, ''),
    apikey: emulatorKey,
    test: '1',
    format: 'json',
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    let response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
        signal: controller.signal,
      })
    } catch {
      throw new SmsPilotError('network/proxy error')
    }

    let data
    try {
      data = await response.json()
    } catch {
      if (!response.ok) {
        throw new SmsPilotError(response.status >= 500 ? 'network/proxy error' : 'HTTP error',
          response.status >= 500 ? '' : String(response.status))
      }
      throw new SmsPilotError('invalid response')
    }

    if (data?.error) throw new SmsPilotError('API error', safeApiCode(data.error.code))
    if (!response.ok) throw new SmsPilotError('HTTP error', String(response.status))

    const sms = data?.send?.[0]
    if (!Array.isArray(data?.send) || data.send.length !== 1 || !sms || typeof sms !== 'object') {
      throw new SmsPilotError('invalid response')
    }
    if ((sms.error != null && Number(sms.error) !== 0) ||
      (sms.status != null && Number(sms.status) < 0)) {
      throw new SmsPilotError('API error', safeApiCode(sms.error))
    }
  } finally {
    clearTimeout(timeout)
  }
}
