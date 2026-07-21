/**
 * Submits a verification to Kernaq Identity API with the capture session token
 * attached as X-Capture-Token. This is what proves the payload came from a
 * real device running the Kernaq SDK, not a virtual camera or script.
 */
import type {
  SubmitVerificationOptions,
  SubmitVerificationResponse,
} from './types'
import { makeError } from './errors'

const DEFAULT_API_URL = 'https://api.kernaq.com/v1'

export async function submitVerification(
  opts: SubmitVerificationOptions,
  identityApiUrl: string = DEFAULT_API_URL,
): Promise<SubmitVerificationResponse> {
  const base = identityApiUrl.replace(/\/$/, '')

  const form = new FormData()
  form.append('document',      opts.document,  opts.documentName ?? 'document.jpg')
  form.append('selfie',        opts.selfie,    opts.selfieName   ?? 'selfie.jpg')
  form.append('video',         opts.video,     opts.videoName    ?? 'liveness.webm')
  form.append('document_type', opts.documentType)
  form.append('country',       opts.country)
  form.append('reference',     opts.reference)
  if (opts.externalUserId) {
    form.append('external_user_id', opts.externalUserId)
  }

  let res: Response
  try {
    res = await fetch(`${base}/verifications`, {
      method:  'POST',
      headers: {
        // X-Capture-Token: the cryptographic proof of origin.
        // The backend validates its SHA-256 hash against capture_sessions.
        'X-Capture-Token': opts.sessionToken,
      },
      body: form,
    })
  } catch {
    throw makeError('SUBMISSION_FAILED', 'Network error while submitting verification')
  }

  const body = await res.json() as Record<string, unknown>

  if (!res.ok) {
    throw makeError(
      'SUBMISSION_FAILED',
      (body['message'] as string | undefined) ?? `HTTP ${res.status}`,
    )
  }

  return {
    verificationId: body['verification_id'] as string,
    reference:      body['reference']       as string,
    status:         body['status']          as string,
    message:        body['message']         as string,
  }
}
