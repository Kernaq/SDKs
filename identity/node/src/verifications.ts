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
   * Submit a full KYC verification and return immediately (HTTP 202).
   * Use `submitAndWait` to automatically poll until the pipeline completes.
   *
   * Supports two liveness modes:
   *  - Standard: supply `video`
   *  - Low-bandwidth (2G/3G): supply `frame1` + `frame2` + `frame3`
   *
   * @example
   * const submitted = await kernaq.verifications.submit({
   *   document:     fs.createReadStream('id.jpg'),
   *   selfie:       fs.createReadStream('selfie.jpg'),
   *   video:        fs.createReadStream('liveness.mp4'),
   *   documentType: 'national_id',
   *   country:      'KEN',
   *   reference:    'user_123',
   * })
   */
  async submit(req: SubmitVerificationRequest): Promise<SubmitVerificationResponse> {
    const fields: Record<string, string> = {
      document_type: req.documentType,
      country:       req.country,
      reference:     req.reference,
    }
    if (req.externalUserId)    fields['external_user_id']   = req.externalUserId
    if (req.consentReference)  fields['consent_reference']  = req.consentReference
    if (req.consentAt)         fields['consent_at']         = req.consentAt
    if (req.consentType)       fields['consent_type']       = req.consentType

    const files: Array<{ field: string; value: FileInput; filename: string; contentType: string }> = [
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
    ]

    if (req.video) {
      files.push({
        field:       'video',
        value:       req.video as FileInput,
        filename:    req.videoName ?? 'liveness.mp4',
        contentType: contentTypeFromName(req.videoName ?? 'liveness.mp4'),
      })
    } else if (req.frame1 && req.frame2 && req.frame3) {
      files.push(
        { field: 'frame_1', value: req.frame1 as FileInput, filename: req.frame1Name ?? 'frame_1.jpg', contentType: 'image/jpeg' },
        { field: 'frame_2', value: req.frame2 as FileInput, filename: req.frame2Name ?? 'frame_2.jpg', contentType: 'image/jpeg' },
        { field: 'frame_3', value: req.frame3 as FileInput, filename: req.frame3Name ?? 'frame_3.jpg', contentType: 'image/jpeg' },
      )
    }

    // Capture session headers — injected when project has require_capture_token=true
    const extraHeaders: Record<string, string> = {}
    if (req.captureToken) extraHeaders['X-Capture-Token'] = req.captureToken
    if (req.captureNonce) extraHeaders['X-Capture-Nonce'] = req.captureNonce

    return this.uploadWithHeaders<SubmitVerificationResponse>('/verifications', fields, files, extraHeaders)
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
   * if (result.status === 'failed') {
   *   console.log(result.failure_reason) // 'face_mismatch'
   * }
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

  /** Get the full result for a verification, including failure_reason when failed. */
  get(id: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('GET', `/verifications/${id}`)
  }

  /** Poll the lightweight status endpoint — includes failure_reason on failed verifications. */
  getStatus(id: string): Promise<VerificationStatusResponse> {
    return this.request<VerificationStatusResponse>('GET', `/verifications/${id}/status`)
  }

  /** Get the full verification report (only available after pipeline completes). */
  getReport(id: string): Promise<VerificationReport> {
    return this.request<VerificationReport>('GET', `/verifications/${id}/report`)
  }

  /**
   * List verifications for the authenticated project.
   *
   * @example
   * // List failed verifications
   * const page = await kernaq.verifications.list({ status: 'failed', limit: 50 })
   */
  list(opts: ListVerificationsOptions = {}): Promise<ListVerificationsResponse> {
    const params = new URLSearchParams()
    if (opts.limit)  params.set('limit',  String(opts.limit))
    if (opts.before) params.set('before', opts.before)
    if (opts.status) params.set('status', opts.status)
    const qs = params.toString()
    return this.request<ListVerificationsResponse>('GET', `/verifications${qs ? `?${qs}` : ''}`)
  }

  // Uploads with extra headers (capture token injection)
  private async uploadWithHeaders<T>(
    path: string,
    fields: Record<string, string>,
    files: Array<{ field: string; value: FileInput; filename: string; contentType: string }>,
    extraHeaders: Record<string, string>,
  ): Promise<T> {
    if (Object.keys(extraHeaders).length === 0) {
      return this.upload<T>(path, fields, files)
    }
    // Re-implement with extra headers — can't inject into BaseClient.upload without subclassing
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) form.append(key, value)
    for (const { field, value, filename, contentType } of files) {
      let blob: Blob
      if (value instanceof Blob)        blob = value
      else if (value instanceof ArrayBuffer) blob = new Blob([value], { type: contentType })
      else if (Buffer.isBuffer(value as Buffer))   blob = new Blob([value as Buffer], { type: contentType })
      else {
        const chunks: Uint8Array[] = []
        const reader = (value as ReadableStream<Uint8Array>).getReader()
        while (true) {
          const { done, value: chunk } = await reader.read()
          if (done) break
          chunks.push(chunk)
        }
        blob = new Blob(chunks, { type: contentType })
      }
      form.append(field, new File([blob], filename, { type: contentType }))
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: { 'X-API-Key': this.apiKey, 'Accept': 'application/json', ...extraHeaders },
      body:    form,
      signal:  AbortSignal.timeout(this.timeout),
    })

    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = { code: 'PARSE_ERROR', message: text } }
    if (!res.ok) {
      const { KernaqError } = await import('./types.js')
      const err = body as { code?: string; message?: string }
      throw new KernaqError({ code: err?.code ?? 'UNKNOWN_ERROR', message: err?.message ?? `HTTP ${res.status}` }, res.status)
    }
    return body as T
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
