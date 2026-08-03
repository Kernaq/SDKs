/**
 * @kernaq/identity — Official Node.js SDK for the Kernaq Identity API.
 * Requires Node.js 18+.
 *
 * Process-and-forget model: submit → result in 3-8s → nothing stored.
 *
 * @example
 * import { Kernaq } from '@kernaq/identity'
 * import * as fs from 'fs'
 *
 * const kernaq = new Kernaq({ apiKey: process.env.KERNAQ_API_KEY! })
 *
 * // Full KYC pipeline — synchronous, result in 3-8s
 * const result = await kernaq.verify.run({
 *   document:     fs.createReadStream('id.jpg'),
 *   selfie:       fs.createReadStream('selfie.jpg'),
 *   video:        fs.createReadStream('liveness.mp4'),
 *   documentType: 'national_id',
 *   country:      'KEN',
 * })
 * if (result.verdict === 'pass') { ... }
 *
 * // Standalone OCR
 * const fields = await kernaq.documents.extract({ document: fs.createReadStream('id.jpg') })
 *
 * // Standalone face match
 * const match = await kernaq.face.match({ faceA: fs.createReadStream('doc.jpg'), faceB: fs.createReadStream('selfie.jpg') })
 *
 * // Usage stats (non-PII)
 * const stats = await kernaq.usage.get({ days: 30 })
 */

import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from './client.js'
import { VerificationsResource } from './verifications.js'
import { DocumentsResource }     from './documents.js'
import { FaceResource }          from './face.js'
import { LivenessResource }      from './liveness.js'
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
  /** Full synchronous KYC pipeline — document + selfie + liveness. */
  readonly verify:     VerificationsResource
  /** Standalone document OCR and validation (stateless). */
  readonly documents:  DocumentsResource
  /** Standalone face detection and matching (stateless). */
  readonly face:       FaceResource
  /** Standalone liveness detection (stateless). */
  readonly liveness:   LivenessResource

  constructor(config: KernaqConfig = {}) {
    const apiKey = config.apiKey ?? process.env['KERNAQ_API_KEY'] ?? ''
    if (!apiKey) throw new Error(
      'Kernaq: apiKey is required. Pass it as config.apiKey or set KERNAQ_API_KEY.',
    )
    const baseUrl = config.baseUrl ?? process.env['KERNAQ_API_URL'] ?? DEFAULT_BASE_URL
    const timeout = config.timeoutMs ?? DEFAULT_TIMEOUT

    this.verify    = new VerificationsResource(apiKey, baseUrl, timeout)
    this.documents = new DocumentsResource(apiKey, baseUrl, timeout)
    this.face      = new FaceResource(apiKey, baseUrl, timeout)
    this.liveness  = new LivenessResource(apiKey, baseUrl, timeout)
  }
}
