/**
 * Kernaq Identity API — shared types.
 * Shapes confirmed against live API spec (OpenAPI 1.0.0, July 2026).
 */

// ── Configuration ─────────────────────────────────────────────────────────────

export interface KernaqConfig {
  /** API key — k_live_… for production, k_test_… for sandbox.
   *  Falls back to KERNAQ_API_KEY environment variable. */
  apiKey?: string
  /** Override the base URL. Defaults to KERNAQ_API_URL env var or https://api.kernaq.com/v1 */
  baseUrl?: string
  /** Request timeout in milliseconds. Default: 120_000 (2 min). */
  timeoutMs?: number
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface KernaqErrorBody {
  code:    string
  message: string
}

export class KernaqError extends Error {
  readonly code:       string
  readonly statusCode: number

  constructor(body: KernaqErrorBody, statusCode: number) {
    super(body.message)
    this.name       = 'KernaqError'
    this.code       = body.code
    this.statusCode = statusCode
  }
}

// ── Document types ────────────────────────────────────────────────────────────

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

// ── Verification ──────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'verified'
  | 'failed'
  | 'review'

/** Machine-readable reason set when status == "failed". */
export type FailureReason =
  | 'pipeline_timeout'
  | 'pipeline_error'
  | 'face_mismatch'
  | 'liveness_failed'
  | 'document_invalid'
  | 'high_risk'
  | 'fraud_detected'

export interface SubmitVerificationRequest {
  /** Government-issued ID image (Buffer, ReadableStream, Blob, or ArrayBuffer). */
  document:     Buffer | ReadableStream | Blob | ArrayBuffer
  documentName?: string
  /** Portrait selfie image. */
  selfie:       Buffer | ReadableStream | Blob | ArrayBuffer
  selfieName?:  string

  // ── Liveness — provide either video OR all three frames ───────────────────
  /** Liveness video (MP4, MOV, or WebM). */
  video?:       Buffer | ReadableStream | Blob | ArrayBuffer
  videoName?:   string
  /** Low-bandwidth alternative: 3 JPEG frames instead of a video. */
  frame1?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame1Name?:  string
  frame2?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame2Name?:  string
  frame3?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame3Name?:  string

  documentType: DocumentType
  /** ISO 3166-1 alpha-3 country code, e.g. "KEN". */
  country:      string
  /** Your unique reference for this user — idempotency key. 1–255 chars, [a-zA-Z0-9_-.] */
  reference:    string
  externalUserId?: string

  // ── DPA 2019 consent metadata (optional) ─────────────────────────────────
  consentReference?: string
  consentAt?:        string  // ISO 8601 datetime
  consentType?:      string  // e.g. "explicit", "legitimate_interest"

  // ── Capture session (when project.require_capture_token = true) ───────────
  captureToken?: string
  captureNonce?: string
}

export interface SubmitVerificationResponse {
  verification_id: string
  reference:       string
  status:          VerificationStatus
  message:         string
}

export interface VerificationStatusResponse {
  verification_id: string
  status:          VerificationStatus
  failure_reason?: FailureReason
}

export interface ExtractedFields {
  first_name?:      string
  last_name?:       string
  document_number?: string
  date_of_birth?:   string
  expiry_date?:     string
  country?:         string
  raw_fields?:      Record<string, unknown>
}

export interface VerificationDocument {
  valid:           boolean
  type:            string
  extracted_data?: ExtractedFields
}

export interface VerificationFace {
  matched:    boolean
  confidence: number
}

export interface VerificationLiveness {
  passed: boolean
}

/** Movement analysis details returned inside LivenessCheckResponse.details */
export interface LivenessDetails {
  mode:              'video' | 'frame_sequence'
  detected_frames:   number
  extracted_frames:  number
  delta_yaw:         number
  delta_pitch:       number
  delta_roll:        number
  movement_detected: boolean
}

export interface VerificationRisk {
  level: 'low' | 'medium' | 'high' | 'unknown'
}

export interface VerificationResult {
  verification_id: string
  status:          VerificationStatus
  /** Set when status == "failed". Tells you exactly why without inspecting sub-entities. */
  failure_reason?: FailureReason
  confidence?:     number
  document?:       VerificationDocument
  face?:           VerificationFace
  liveness?:       VerificationLiveness
  risk?:           VerificationRisk
}

export type VerificationReport = Record<string, unknown>

export interface VerificationSummary {
  verification_id:  string
  reference:        string
  status:           VerificationStatus
  failure_reason?:  FailureReason
  confidence?:      number
  created_at:       string
}

export interface ListVerificationsResponse {
  verifications: VerificationSummary[]
  next_cursor?:  string
}

export interface ListVerificationsOptions {
  limit?:  number
  before?: string
  /** Filter by status. Omit to return all statuses. */
  status?: VerificationStatus
}

// ── Poll options ──────────────────────────────────────────────────────────────

export interface PollOptions {
  intervalMs?: number  // default 2000
  timeoutMs?:  number  // default 180_000
  onStatus?:   (status: VerificationStatus) => void
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface ExtractDocumentRequest {
  document:      Buffer | ReadableStream | Blob | ArrayBuffer
  documentName?: string
  documentType?: DocumentType
  country?:      string
}

export interface ExtractDocumentResponse {
  document_type: string
  fields:        ExtractedFields
  raw_lines?:    string[]
  processed_at:  string
}

export interface ValidateDocumentRequest {
  document:      Buffer | ReadableStream | Blob | ArrayBuffer
  documentName?: string
  documentType?: DocumentType
  country?:      string
}

export interface ValidateDocumentResponse {
  valid:         boolean
  document_type: string
  flags?:        string[]
  processed_at:  string
}

// ── Face ──────────────────────────────────────────────────────────────────────

export interface FaceDetectRequest {
  image:      Buffer | ReadableStream | Blob | ArrayBuffer
  imageName?: string
}

export interface BoundingBox {
  left:   number
  top:    number
  width:  number
  height: number
}

export interface FaceDetectResponse {
  detected:        boolean
  confidence:      number
  bounding_box?:   BoundingBox
  age_range_low?:  number
  age_range_high?: number
  gender?:         string
  attributes?:     Record<string, unknown>
  processed_at:    string
}

export interface FaceMatchRequest {
  imageA:      Buffer | ReadableStream | Blob | ArrayBuffer
  imageAName?: string
  imageB:      Buffer | ReadableStream | Blob | ArrayBuffer
  imageBName?: string
}

export interface FaceMatchResponse {
  matched:      boolean
  confidence:   number
  processed_at: string
}

// ── Liveness ──────────────────────────────────────────────────────────────────

export interface LivenessCheckRequest {
  video:      Buffer | ReadableStream | Blob | ArrayBuffer
  videoName?: string
}

export interface LivenessCheckResponse {
  passed:       boolean
  confidence?:  number
  details?:     LivenessDetails
  processed_at: string
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'verification.completed'
  | 'verification.failed'
  | 'verification.review'

export interface CreateWebhookRequest {
  /** HTTPS URL that will receive POST requests */
  url:    string
  events: WebhookEvent[]
}

export interface WebhookCreatedResponse {
  id:         string
  url:        string
  events:     WebhookEvent[]
  is_active:  boolean
  /** HMAC-SHA256 signing secret — shown ONCE on creation. Store it securely. */
  secret:     string
  created_at: string
  message:    string
}

export interface Webhook {
  id:         string
  url:        string
  events:     WebhookEvent[]
  is_active:  boolean
  created_at: string
}

export interface WebhookListResponse {
  webhooks: Webhook[]
  total:    number
}

export interface UpdateWebhookRequest {
  url?:       string
  events?:    WebhookEvent[]
  is_active?: boolean
}

export interface RotateSecretResponse {
  id:      string
  secret:  string
  message: string
}

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'abandoned'

export interface WebhookDelivery {
  id:            string
  event_type:    string
  event_id:      string
  status:        WebhookDeliveryStatus
  attempts:      number
  max_attempts:  number
  next_attempt?: string
  last_error?:   string
  delivered_at?: string
  created_at:    string
}

export interface WebhookDeliveryListResponse {
  deliveries: WebhookDelivery[]
  total:      number
}

// ── Capture sessions ──────────────────────────────────────────────────────────

export interface CreateCaptureSessionRequest {
  /** Ties the session to a specific user or flow. Same as verification reference. */
  reference:   string
  device_info?: string
}

export interface CaptureSessionResponse {
  session_id:  string
  /** 64-char hex token. Pass to the capture SDK. Include as X-Capture-Token on submit. */
  token:       string
  /** 32-char hex nonce. Include as X-Capture-Nonce on submit. Single-use. */
  nonce:       string
  expires_at:  string
  ttl_seconds: number
  message:     string
}

// ── Project settings ──────────────────────────────────────────────────────────

export interface ProjectSettings {
  project_id:                  string
  risk_threshold_medium:       number
  risk_threshold_high:         number
  max_attempts_per_reference:  number
  require_capture_token:       boolean
  enable_cross_project_dedup:  boolean
  created_at:                  string
  updated_at:                  string
}

export interface UpdateSettingsRequest {
  risk_threshold_medium?:      number
  risk_threshold_high?:        number
  max_attempts_per_reference?: number
  require_capture_token?:      boolean
  enable_cross_project_dedup?: boolean
}
