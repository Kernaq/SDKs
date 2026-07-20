/**
 * Kernaq Identity API — shared types.
 * Shapes confirmed against live API (34/34 tests pass, July 2026).
 */

// ── Configuration ─────────────────────────────────────────────────────────────

export interface KernaqConfig {
  /** API key — k_live_… for production, k_test_… for sandbox.
   *  Can also be set via KERNAQ_API_KEY environment variable. */
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
  | 'national_id'
  | 'passport'
  | 'driver_license'
  | 'residence_permit'
  | 'business_registration'

// ── Verification ──────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'verified'
  | 'failed'
  | 'review'

export interface SubmitVerificationRequest {
  /** Government-issued ID image (Buffer, ReadableStream, or Blob). */
  document:     Buffer | NodeJS.ReadableStream | Blob
  /** Filename for the document (e.g. "id.jpg"). */
  documentName?: string
  /** Portrait selfie image. */
  selfie:       Buffer | NodeJS.ReadableStream | Blob
  selfieName?:  string
  /** Liveness video (MP4, MOV, or WebM). */
  video:        Buffer | NodeJS.ReadableStream | Blob
  videoName?:   string
  documentType: DocumentType
  /** ISO 3166-1 alpha-3 country code, e.g. "KEN". */
  country:      string
  /** Your system's unique ID for this user — used for idempotency. */
  reference:    string
  /** Optional external user ID to attach to the record. */
  externalUserId?: string
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
}

export interface ExtractedFields {
  first_name?:       string
  last_name?:        string
  document_number?:  string
  date_of_birth?:    string
  expiry_date?:      string
  country?:          string
  raw_fields?:       Record<string, unknown>
}

export interface VerificationDocument {
  valid:          boolean
  type:           string
  extracted_data?: ExtractedFields
}

export interface VerificationFace {
  matched:    boolean
  confidence: number
}

export interface VerificationLiveness {
  passed: boolean
}

export interface VerificationRisk {
  level: string
}

export interface VerificationResult {
  verification_id: string
  status:          VerificationStatus
  confidence?:     number
  document?:       VerificationDocument
  face?:           VerificationFace
  liveness?:       VerificationLiveness
  risk?:           VerificationRisk
}

export type VerificationReport = Record<string, unknown>

export interface VerificationSummary {
  verification_id: string
  reference:       string
  status:          VerificationStatus
  confidence?:     number
  created_at:      string
}

export interface ListVerificationsResponse {
  verifications: VerificationSummary[]
  next_cursor?:  string
}

export interface ListVerificationsOptions {
  limit?:  number
  before?: string
}

// ── Poll options ──────────────────────────────────────────────────────────────

export interface PollOptions {
  /** How often to poll in ms. Default: 2000. */
  intervalMs?: number
  /** Max time to wait in ms. Default: 180_000 (3 min). */
  timeoutMs?:  number
  /** Called on each poll with the current status. */
  onStatus?:   (status: VerificationStatus) => void
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface ExtractDocumentRequest {
  document:      Buffer | NodeJS.ReadableStream | Blob
  documentName?: string
  documentType?: DocumentType
  country?:      string
}

export interface ExtractDocumentResponse {
  document_type:  string
  fields:         ExtractedFields
  raw_lines?:     string[]
  processed_at:   string
}

export interface ValidateDocumentRequest {
  document:      Buffer | NodeJS.ReadableStream | Blob
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
  image:      Buffer | NodeJS.ReadableStream | Blob
  imageName?: string
}

export interface BoundingBox {
  left:   number
  top:    number
  width:  number
  height: number
}

export interface FaceAttributes {
  smile?:       boolean
  eyeglasses?:  boolean
  sunglasses?:  boolean
  [key: string]: unknown
}

export interface FaceDetectResponse {
  detected:      boolean
  confidence:    number
  bounding_box?: BoundingBox
  age_range_low?:  number
  age_range_high?: number
  gender?:       string
  attributes?:   FaceAttributes
}

export interface FaceMatchRequest {
  imageA:      Buffer | NodeJS.ReadableStream | Blob
  imageAName?: string
  imageB:      Buffer | NodeJS.ReadableStream | Blob
  imageBName?: string
}

export interface FaceMatchResponse {
  matched:    boolean
  confidence: number
}

// ── Liveness ──────────────────────────────────────────────────────────────────

export interface LivenessCheckRequest {
  video:      Buffer | NodeJS.ReadableStream | Blob
  videoName?: string
}

export interface LivenessCheckResponse {
  passed:     boolean
  confidence?: number
  reason?:    string
}
