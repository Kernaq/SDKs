/**
 * Submits a captured verification to the Kernaq Identity API.
 *
 * Called from YOUR BACKEND, not the browser. The browser SDK captures
 * and quality-checks the files, then sends the blobs to your backend
 * which calls this function with the API key.
 *
 * @param opts    - Captured files and verification parameters
 * @param apiUrl  - Your backend sets this from its own env (KERNAQ_API_URL).
 *                  Defaults to the Kernaq Identity API base URL.
 */
import type { SubmitVerificationOptions, SubmitVerificationResponse } from './types'
import { makeError } from './errors'

export async function submitVerification(
  opts: SubmitVerificationOptions,
  apiUrl: string,
): Promise<SubmitVerificationResponse> {
  const base = apiUrl.replace(/\/$/, '')

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

  if (opts.video) {
    form.append('video', opts.video, opts.videoName ?? 'liveness.webm')
  } else if (opts.frame1 && opts.frame2 && opts.frame3) {
    form.append('frame_1', opts.frame1, opts.frame1Name ?? 'frame_1.jpg')
    form.append('frame_2', opts.frame2, opts.frame2Name ?? 'frame_2.jpg')
    form.append('frame_3', opts.frame3, opts.frame3Name ?? 'frame_3.jpg')
  }

  let res: Response
  try {
    res = await fetch(`${base}/verify`, {
      method: 'POST',
      body:   form,
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
