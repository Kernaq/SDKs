import { BaseClient } from './client.js'
import type {
  CreateCaptureSessionRequest,
  CaptureSessionResponse,
} from './types.js'

export class CaptureResource extends BaseClient {

  /**
   * Issue a short-lived capture session token (15 min, single-use).
   *
   * Your **backend** calls this, then passes the token + nonce to your
   * frontend / headless capture SDK. Never call this from the browser —
   * it requires your API key.
   *
   * @example
   * // Server-side
   * const session = await kernaq.capture.createSession({ reference: 'user_abc123' })
   * // Return session.token + session.nonce to your frontend
   *
   * // Frontend attaches both as X-Capture-Token / X-Capture-Nonce headers
   * // when submitting the verification via kernaq.verifications.submit()
   */
  createSession(req: CreateCaptureSessionRequest): Promise<CaptureSessionResponse> {
    return this.request<CaptureSessionResponse>('POST', '/capture/sessions', req)
  }
}
