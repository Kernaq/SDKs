import { BaseClient, type FileInput } from './client.js'
import type {
  SubmitVerificationRequest,
  SubmitVerificationResponse,
  VerificationStatusResponse,
  VerificationResult,
  VerificationReport,
  ListVerificationsResponse,
  ListVerificationsOptions,
  PollOptions,
  VerificationStatus,
} from './types.js'

const TERMINAL: VerificationStatus[] = ['verified', 'failed', 'review']

export class VerificationsResource extends BaseClient {

  /**
   * Submit a full KYC verification (document + selfie + liveness video).
   *
   * Returns immediately with status "processing". Use `submitAndWait` to
   * automatically poll until the pipeline completes.
   */
  async submit(req: SubmitVerificationRequest): Promise<SubmitVerificationResponse> {
    const fields: Record<string, string> = {
      document_type: req.documentType,
      country:       req.country,
      reference:     req.reference,
    }
    if (req.externalUserId) fields['external_user_id'] = req.externalUserId

    return this.upload<SubmitVerificationResponse>('/verifications', fields, [
      {
        field:       'document',
        value:       req.document as FileInput,
        filename:    req.documentName ?? 'document.jpg',
        contentType: contentTypeFromName(req.documentName ?? 'document.jpg'),
      },
      {
        field:       'selfie',
        value:       req.selfie as FileInput,
        filename:    req.selfieName ?? 'selfie.jpg',
        contentType: contentTypeFromName(req.selfieName ?? 'selfie.jpg'),
      },
      {
        field:       'video',
        value:       req.video as FileInput,
        filename:    req.videoName ?? 'liveness.mp4',
        contentType: contentTypeFromName(req.videoName ?? 'liveness.mp4'),
      },
    ])
  }

  /**
   * Submit a verification and poll until it reaches a terminal state
   * (verified | failed | review). Throws if the timeout is exceeded.
   *
   * @example
   * const result = await kernaq.verifications.submitAndWait({
   *   document:     fs.createReadStream('id.jpg'),
   *   selfie:       fs.createReadStream('selfie.jpg'),
   *   video:        fs.createReadStream('liveness.mp4'),
   *   documentType: 'passport',
   *   country:      'KEN',
   *   reference:    'user_acct_123',
   * })
   * console.log(result.status) // 'verified'
   */
  async submitAndWait(
    req: SubmitVerificationRequest,
    opts: PollOptions = {},
  ): Promise<VerificationResult> {
    const { intervalMs = 2_000, timeoutMs = 180_000, onStatus } = opts

    const submitted = await this.submit(req)
    const id = submitted.verification_id

    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      await sleep(intervalMs)

      const statusRes = await this.getStatus(id)
      onStatus?.(statusRes.status)

      if (TERMINAL.includes(statusRes.status)) {
        return this.get(id)
      }
    }

    throw new Error(
      `Verification ${id} did not complete within ${timeoutMs / 1000}s. ` +
      `Poll GET /verifications/${id}/status manually.`,
    )
  }

  /** Get the full result for a verification. */
  get(id: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('GET', `/verifications/${id}`)
  }

  /** Poll the lightweight status endpoint. */
  getStatus(id: string): Promise<VerificationStatusResponse> {
    return this.request<VerificationStatusResponse>('GET', `/verifications/${id}/status`)
  }

  /** Get the full verification report (only available after pipeline completes). */
  getReport(id: string): Promise<VerificationReport> {
    return this.request<VerificationReport>('GET', `/verifications/${id}/report`)
  }

  /** List verifications for the authenticated project. */
  list(opts: ListVerificationsOptions = {}): Promise<ListVerificationsResponse> {
    const params = new URLSearchParams()
    if (opts.limit)  params.set('limit', String(opts.limit))
    if (opts.before) params.set('before', opts.before)
    const qs = params.toString()
    return this.request<ListVerificationsResponse>('GET', `/verifications${qs ? `?${qs}` : ''}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function contentTypeFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',  heic: 'image/heic',
    pdf: 'application/pdf',
    mp4: 'video/mp4',  mov: 'video/quicktime', webm: 'video/webm',
  }
  return map[ext] ?? 'application/octet-stream'
}
