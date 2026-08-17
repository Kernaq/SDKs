/**
 * Submits a verification to Kernaq Identity API with the capture session token
 * attached as X-Capture-Token + X-Capture-Nonce. This proves the payload came
 * from a real device running the Kernaq SDK — blocking virtual cameras and scripts.
 *
 * Supports two liveness modes:
 *  - Standard: supply `video`
 *  - Low-bandwidth (2G/3G): supply `frame1` + `frame2` + `frame3`
 */
import type {
  SubmitVerificationOptions,
  SubmitVerificationResponse,
} from './types'
import { makeError } from './errors'

const DEFAULT_API_URL = 'https://api.identity.kernaq.com/v1'

export async function submitVerification(
  opts: SubmitVerificationOptions,
  identityApiUrl: string = DEFAULT_API_URL,
): Promise<SubmitVerificationResponse> {
  const base = identityApiUrl.replace(/\/$/, '')

  const form = new FormData()
  form.append('document',      opts.document,  opts.documentName ?? 'document.jpg')
  form.append('selfie',        opts.selfie,    opts.selfieName   ?? 'selfie.jpg')
  form.append('document_type', opts.documentType)
  form.append('country',       opts.country)
  form.append('reference',     opts.reference)

  if (opts.externalUserId)   form.append('external_user_id',  opts.externalUserId)
  if (opts.consentReference) form.append('consent_reference', opts.consentReference)
  if (opts.consentAt)        form.append('consent_at',        opts.consentAt)
  if (opts.consentType)      form.append('consent_type',      opts.consentType)

  // Liveness: video OR frame sequence
  if (opts.video) {
    form.append('video', opts.video, opts.videoName ?? 'liveness.webm')
  } else if (opts.frame1 && opts.frame2 && opts.frame3) {
    form.append('frame_1', opts.frame1, opts.frame1Name ?? 'frame_1.jpg')
    form.append('frame_2', opts.frame2, opts.frame2Name ?? 'frame_2.jpg')
    form.append('frame_3', opts.frame3, opts.frame3Name ?? 'frame_3.jpg')
  }

  // Attach capture session headers if provided
  // These prove the payload came from a real device running the SDK.
  // Optional until POST /v1/capture/sessions is enabled on your account.
  const captureHeaders: Record<string, string> = {}
  if (opts.sessionToken) captureHeaders['X-Capture-Token'] = opts.sessionToken
  if (opts.nonce)        captureHeaders['X-Capture-Nonce'] = opts.nonce

  let res: Response
  try {
    res = await fetch(`${base}/verify`, {
      method:  'POST',
      headers: captureHeaders,
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
