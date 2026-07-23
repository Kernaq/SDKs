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
  /**
   * Single-use anti-replay nonce — attached as X-Capture-Nonce on submission.
   * The backend verifies this matches the nonce issued with the session,
   * preventing a captured token from being replayed by an attacker.
   */
  nonce: string
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
  /**
   * Anti-replay nonce from CaptureSession.nonce.
   * Must be included — the backend rejects submissions without a matching nonce.
   */
  nonce: string

  document: Blob
  documentName?: string
  selfie: Blob
  selfieName?: string

  // ── Liveness — supply video OR all three frames ──────────────────────────
  /** Standard liveness video (MP4, MOV, WebM). */
  video?: Blob
  videoName?: string
  /**
   * Low-bandwidth alternative to video — 3 JPEG frames for 2G/3G devices.
   * Supply frame1 (front-facing) + frame2 (head left) + frame3 (head right).
   * All three must be supplied together.
   */
  frame1?: Blob
  frame1Name?: string
  frame2?: Blob
  frame2Name?: string
  frame3?: Blob
  frame3Name?: string

  documentType: DocumentType
  country: string          // ISO 3166-1 alpha-3 e.g. 'KEN'
  reference: string
  externalUserId?: string

  // ── DPA 2019 consent metadata (optional) ─────────────────────────────────
  consentReference?: string
  consentAt?:        string  // ISO 8601 datetime
  consentType?:      string  // e.g. "explicit"
}

export type DocumentType =
  // Core identity
  | 'national_id'
  | 'passport'
  | 'driver_license'
  | 'residence_permit'
  | 'business_registration'
  // East Africa
  | 'alien_card'
  | 'kra_pin_certificate'
  | 'sha_card'
  | 'nhif_card'            // alias — normalised to sha_card by server
  | 'voter_id'
  | 'refugee_id'
  | 'foreign_national_id'
  | 'military_id'
  | 'student_id'
  // AML / proof of address
  | 'utility_bill'
  | 'bank_statement'
  | 'proof_of_address'
  | 'tax_document'
  | 'employment_letter'
  | 'vehicle_registration'
  | 'tenancy_agreement'
  | 'other'

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
