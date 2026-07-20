/**
 * Base HTTP client for the Kernaq Identity API.
 * Handles auth, timeouts, error parsing, and multipart uploads.
 */
import fetch, { type RequestInit, type Response } from 'node-fetch'
import FormData from 'form-data'
import { Readable } from 'stream'
import { KernaqError, type KernaqErrorBody } from './types.js'

export const DEFAULT_BASE_URL = process.env['KERNAQ_API_URL'] ?? 'https://api.kernaq.com/v1'
export const DEFAULT_TIMEOUT  = 120_000

export type FileInput = Buffer | NodeJS.ReadableStream | Blob

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
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'X-API-Key':    this.apiKey,
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body:   body ? JSON.stringify(body) : undefined,
        signal: controller.signal as never,
      } satisfies RequestInit)
    } finally {
      clearTimeout(timer)
    }

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
      if (Buffer.isBuffer(value)) {
        form.append(field, value, { filename, contentType })
      } else if (value instanceof Blob) {
        const buf = Buffer.from(await value.arrayBuffer())
        form.append(field, buf, { filename, contentType })
      } else {
        // ReadableStream
        form.append(field, value as Readable, { filename, contentType })
      }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method:  'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept':    'application/json',
          ...form.getHeaders(),
        },
        body:   form,
        signal: controller.signal as never,
      } satisfies RequestInit)
    } finally {
      clearTimeout(timer)
    }

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
      const err = body as KernaqErrorBody
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
