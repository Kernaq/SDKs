/**
 * @kernaq/capture-web — type definitions
 */

export interface KernaqCaptureConfig {
  /**
   * URL of YOUR backend endpoint that calls POST /v1/capture/sessions
   * and returns the session token. The SDK never holds your API key.
   *
   * Your backend endpoint should return: { token: string, expires_at: string }
   */
  sessionEndpoint: string

  /**
   * Base URL of the Kernaq Identity API.
   * Defaults to https://api.kernaq.com/v1
   */
  identityApiUrl?: string

  /**
   * Pre-flight quality thresholds. Adjust to balance UX vs accuracy.
   */
  quality?: QualityConfig
}

export interface QualityConfig {
  /** 0–100. Reject if blur score is below this. Default: 40 */
  minBlurScore?: number
  /** 0–100. Reject if brightness is below this (too dark). Default: 30 */
  minBrightness?: number
  /** 0–100. Reject if brightness is above this (too bright/glare). Default: 220 */
  maxBrightness?: number
  /** Reject if < this % of frame is filled (too zoomed out). Default: 0.15 */
  minFillRatio?: number
}

export interface CaptureSession {
  /** Opaque session token — attached as X-Capture-Token on submission */
  token: string
  expiresAt: Date
}

export interface CaptureResult {
  /** Captured image or video blob */
  blob: Blob
  mimeType: string
  /** Pre-flight quality scores — for debugging or adaptive UI */
  quality: QualityReport
}

export interface QualityReport {
  passed: boolean
  blurScore: number        // 0–100, higher = sharper
  brightness: number       // 0–255 average luminance
  fillRatio: number        // 0–1 fraction of frame that is non-background
  failures: QualityFailure[]
}

export type QualityFailure =
  | 'too_blurry'
  | 'too_dark'
  | 'too_bright'
  | 'too_small'

export interface SubmitVerificationOptions {
  /** Session token from CaptureSession.token */
  sessionToken: string
  document: Blob
  documentName?: string
  selfie: Blob
  selfieName?: string
  video: Blob
  videoName?: string
  documentType: DocumentType
  country: string          // ISO 3166-1 alpha-3 e.g. 'KEN'
  reference: string
  externalUserId?: string
}

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'driver_license'
  | 'residence_permit'
  | 'business_registration'

export interface SubmitVerificationResponse {
  verificationId: string
  reference: string
  status: string
  message: string
}

export type LivenessInstruction =
  | 'align_face'
  | 'hold_still'
  | 'turn_left'
  | 'turn_right'
  | 'blink'
  | 'done'

export interface CaptureError extends Error {
  code: CaptureErrorCode
}

export type CaptureErrorCode =
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_NOT_FOUND'
  | 'QUALITY_CHECK_FAILED'
  | 'SESSION_EXPIRED'
  | 'SESSION_FETCH_FAILED'
  | 'SUBMISSION_FAILED'
  | 'BROWSER_NOT_SUPPORTED'
