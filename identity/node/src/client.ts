/**
 * Base HTTP client for the Kernaq Identity API.
 * Uses native fetch and FormData — requires Node.js 18+ or any modern browser.
 * No external HTTP dependencies.
 */

export const DEFAULT_BASE_URL = process.env['KERNAQ_API_URL'] ?? 'https://api.identity.kernaq.com/v1'
export const DEFAULT_TIMEOUT  = 120_000

export type FileInput = Buffer | ReadableStream | Blob | ArrayBuffer

export class BaseClient {
  protected readonly apiKey:  string
  protected readonly baseUrl: string
  protected readonly timeout: number

  constructor(apiKey: string, baseUrl: string, timeout: number) {
    this.apiKey  = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.timeout = timeout
  }

  // ── JSON request ───────────────────────────────────────────────────────────

  protected async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const signal = AbortSignal.timeout(this.timeout)

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'X-API-Key':    this.apiKey,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body:   body != null ? JSON.stringify(body) : undefined,
      signal,
    })

    return this.parseResponse<T>(res)
  }

  // ── Multipart upload ───────────────────────────────────────────────────────

  protected async upload<T>(
    path: string,
    fields: Record<string, string>,
    files: Array<{ field: string; value: FileInput; filename: string; contentType: string }>,
  ): Promise<T> {
    const form = new FormData()

    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value)
    }

    for (const { field, value, filename, contentType } of files) {
      let blob: Blob
      if (value instanceof Blob) {
        blob = value
      } else if (value instanceof ArrayBuffer) {
        blob = new Blob([value], { type: contentType })
      } else if (Buffer.isBuffer(value)) {
        blob = new Blob([value], { type: contentType })
      } else {
        // ReadableStream — collect chunks
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

    const signal = AbortSignal.timeout(this.timeout)
    const res = await fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Accept':    'application/json',
        // Do NOT set Content-Type — browser/Node sets it with boundary automatically
      },
      body:   form,
      signal,
    })

    return this.parseResponse<T>(res)
  }

  // ── Response parser ────────────────────────────────────────────────────────

  private async parseResponse<T>(res: Response): Promise<T> {
    const text = await res.text()
    let body: unknown

    try {
      body = JSON.parse(text)
    } catch {
      body = { code: 'PARSE_ERROR', message: text || 'Empty response' }
    }

    if (!res.ok) {
      const { KernaqError } = await import('./types.js')
      const err = body as { code?: string; message?: string }
      throw new KernaqError(
        {
          code:    err?.code    ?? 'UNKNOWN_ERROR',
          message: err?.message ?? `HTTP ${res.status}`,
        },
        res.status,
      )
    }

    return body as T
  }
}
