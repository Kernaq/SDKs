/**
 * @kernaq/capture-web
 *
 * Headless capture SDK for web browsers.
 *
 * Responsibilities:
 *  1. Fetch a short-lived session token from your backend (which calls Kernaq).
 *  2. Open the device camera invisibly behind your own UI.
 *  3. Run a pre-flight quality check (blur, brightness, fill) before upload.
 *  4. Submit the verification with a cryptographic session token that proves
 *     the payload came from a real device — blocking virtual cameras and scripts.
 *
 * @example
 * ```ts
 * import { KernaqCapture, CameraCapture } from '@kernaq/capture-web'
 *
 * // 1. Initialise
 * const kernaq = new KernaqCapture({
 *   sessionEndpoint: '/api/kernaq/session', // YOUR backend route
 *   identityApiUrl:  'https://api.kernaq.com/v1',
 * })
 *
 * // 2. Get a session token (your backend calls POST /v1/capture/sessions)
 * const session = await kernaq.createSession({ reference: 'user_abc123' })
 *
 * // 3. Capture document photo
 * const docCamera = new CameraCapture({
 *   videoElement: document.getElementById('doc-preview') as HTMLVideoElement,
 *   facingMode: 'environment',
 * })
 * await docCamera.start()
 * const docResult = await docCamera.capturePhoto()
 * docCamera.stop()
 *
 * // 4. Capture selfie
 * const selfieCamera = new CameraCapture({
 *   videoElement: document.getElementById('selfie-preview') as HTMLVideoElement,
 *   facingMode: 'user',
 * })
 * await selfieCamera.start()
 * const selfieResult = await selfieCamera.capturePhoto()
 *
 * // 5. Record liveness video (3 seconds)
 * selfieCamera.startRecording()
 * await new Promise(r => setTimeout(r, 3000))
 * const videoResult = await selfieCamera.stopRecording()
 * selfieCamera.stop()
 *
 * // 6. Submit — X-Capture-Token attached automatically
 * const result = await kernaq.submit({
 *   sessionToken: session.token,
 *   document:     docResult.blob,
 *   selfie:       selfieResult.blob,
 *   video:        videoResult.blob,
 *   documentType: 'passport',
 *   country:      'KEN',
 *   reference:    'user_abc123',
 * })
 *
 * console.log(result.verificationId, result.status)
 * ```
 */

export { CameraCapture }    from './camera'
export { analyseImage, analyseVideoFrame } from './quality'
export { fetchSession }     from './session'
export { submitVerification } from './submit'
export * from './types'

import { fetchSession }       from './session'
import { submitVerification } from './submit'
import type {
  KernaqCaptureConfig,
  CaptureSession,
  SubmitVerificationOptions,
  SubmitVerificationResponse,
} from './types'

/**
 * Main entry point. Instantiate once per flow.
 */
export class KernaqCapture {
  private config: KernaqCaptureConfig

  constructor(config: KernaqCaptureConfig) {
    this.config = config
  }

  /**
   * Fetch a capture session token from your backend.
   * Your backend must call POST /v1/capture/sessions and return { token, expires_at }.
   */
  async createSession(opts: { reference: string; deviceInfo?: string }): Promise<CaptureSession> {
    return fetchSession(this.config.sessionEndpoint, opts.reference, opts.deviceInfo)
  }

  /**
   * Submit a verification with cryptographic proof of origin.
   * Attaches X-Capture-Token automatically.
   */
  async submit(opts: SubmitVerificationOptions): Promise<SubmitVerificationResponse> {
    return submitVerification(opts, this.config.identityApiUrl)
  }
}
