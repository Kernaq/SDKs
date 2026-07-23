/**
 * Session manager — fetches a capture session token from the client's
 * backend, which in turn calls POST /v1/capture/sessions on Kernaq.
 *
 * The raw API key NEVER lives in the browser. Only the short-lived
 * session token (15 min TTL) is exposed to the front end.
 */
import type { CaptureSession } from './types'
import { makeError } from './errors'

export async function fetchSession(
  sessionEndpoint: string,
  reference: string,
  deviceInfo?: string,
): Promise<CaptureSession> {
  let res: Response
  try {
    res = await fetch(sessionEndpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reference, device_info: deviceInfo ?? getBrowserInfo() }),
    })
  } catch {
    throw makeError('SESSION_FETCH_FAILED', `Failed to reach session endpoint: ${sessionEndpoint}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw makeError('SESSION_FETCH_FAILED', `Session endpoint returned ${res.status}: ${body}`)
  }

  const data = await res.json() as { token?: string; nonce?: string; expires_at?: string }
  if (!data.token) {
    throw makeError('SESSION_FETCH_FAILED', 'Session endpoint did not return a token')
  }
  if (!data.nonce) {
    throw makeError('SESSION_FETCH_FAILED', 'Session endpoint did not return a nonce')
  }

  return {
    token:     data.token,
    nonce:     data.nonce,
    expiresAt: data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 14 * 60 * 1000),
  }
}

function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') return 'KernaqCaptureSDK/1.0'
  return `KernaqCaptureSDK/1.0 ${navigator.userAgent.slice(0, 120)}`
}
