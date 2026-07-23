/**
 * @kernaq/identity — Official Node.js SDK for the Kernaq Identity API.
 * Requires Node.js 18+ (uses native fetch and FormData).
 *
 * @example
 * import { Kernaq } from '@kernaq/identity'
 * import * as fs from 'fs'
 *
 * const kernaq = new Kernaq({ apiKey: process.env.KERNAQ_API_KEY! })
 *
 * const result = await kernaq.verifications.submitAndWait({
 *   document:     fs.createReadStream('passport.jpg'),
 *   selfie:       fs.createReadStream('selfie.jpg'),
 *   video:        fs.createReadStream('liveness.mp4'),
 *   documentType: 'passport',
 *   country:      'KEN',
 *   reference:    'user_acct_123',
 * })
 *
 * console.log(result.status)         // 'verified'
 * console.log(result.face?.matched)  // true
 * console.log(result.risk?.level)    // 'low'
 */

import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from './client.js'
import { VerificationsResource } from './verifications.js'
import { DocumentsResource }     from './documents.js'
import { FaceResource }          from './face.js'
import { LivenessResource }      from './liveness.js'
import { WebhooksResource }      from './webhooks.js'
import { CaptureResource }       from './capture.js'
import { SettingsResource }      from './settings.js'
import type { KernaqConfig }     from './types.js'

export { KernaqError }  from './types.js'
export type * from './types.js'

/**
 * Main entry point. Instantiate once per process and reuse.
 *
 * @example
 * const kernaq = new Kernaq({ apiKey: process.env.KERNAQ_API_KEY! })
 */
export class Kernaq {
  /** Full KYC pipeline — document + selfie + liveness. */
  readonly verifications: VerificationsResource
  /** Standalone document OCR and validation. */
  readonly documents:     DocumentsResource
  /** Standalone face detection and matching. */
  readonly face:          FaceResource
  /** Standalone liveness detection. */
  readonly liveness:      LivenessResource
  /** Register and manage webhook endpoints for event callbacks. */
  readonly webhooks:      WebhooksResource
  /** Issue capture session tokens for the headless capture SDK. */
  readonly capture:       CaptureResource
  /** Per-project risk thresholds and security configuration. */
  readonly settings:      SettingsResource

  constructor(config: KernaqConfig = {}) {
    const apiKey = config.apiKey ?? process.env['KERNAQ_API_KEY'] ?? ''
    if (!apiKey) throw new Error(
      'Kernaq: apiKey is required. Pass it as config.apiKey or set KERNAQ_API_KEY.',
    )

    const baseUrl = config.baseUrl ?? process.env['KERNAQ_API_URL'] ?? DEFAULT_BASE_URL
    const timeout = config.timeoutMs ?? DEFAULT_TIMEOUT

    this.verifications = new VerificationsResource(apiKey, baseUrl, timeout)
    this.documents     = new DocumentsResource(apiKey, baseUrl, timeout)
    this.face          = new FaceResource(apiKey, baseUrl, timeout)
    this.liveness      = new LivenessResource(apiKey, baseUrl, timeout)
    this.webhooks      = new WebhooksResource(apiKey, baseUrl, timeout)
    this.capture       = new CaptureResource(apiKey, baseUrl, timeout)
    this.settings      = new SettingsResource(apiKey, baseUrl, timeout)
  }
}
