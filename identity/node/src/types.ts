/**
 * Kernaq Identity API — shared types.
 * Synchronous process-and-forget model (v2).
 */

// ── Configuration ─────────────────────────────────────────────────────────────

export interface KernaqConfig {
  /** API key — k_live_… for production, k_test_… for sandbox.
   *  Falls back to KERNAQ_API_KEY environment variable. */
  apiKey?: string
  /** Override the base URL. Defaults to KERNAQ_API_URL env var or https://api.identity.kernaq.com/v1 */
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

// ── VerifyResult — returned synchronously by POST /v1/verify ─────────────────

export type Verdict = 'pass' | 'fail' | 'review'

/** Parsed document fields extracted from the ID. */
export interface DocumentFields {
  name?:            string
  date_of_birth?:   string
  document_number?: string
  expiry_date?:     string
  country?:         string
  document_type?:   string
  is_valid?:        boolean
}

/**
 * Full result returned synchronously (200 OK) by POST /v1/verify
 * and POST /v1/verify/sandbox.
 * On unprocessable input the server returns 422 with an error body instead.
 */
export interface VerifyResult {
  request_id:       string
  verdict:          Verdict
  score:            number   // 0–100
  face_match:       boolean
  face_confidence:  number
  liveness_pass:    boolean
  document_fields:  DocumentFields
  fraud_flags:      string[]
  failure_reason?:  string
  duration_ms:      number
}

// ── Verify request ────────────────────────────────────────────────────────────

export interface VerifyRequest {
  /** Government-issued ID image (Buffer, ReadableStream, Blob, or ArrayBuffer). */
  document:     Buffer | ReadableStream | Blob | ArrayBuffer
  documentName?: string
  /** Portrait selfie image. */
  selfie:       Buffer | ReadableStream | Blob | ArrayBuffer
  selfieName?:  string

  // ── Liveness — provide either video OR all three frames ───────────────────
  video?:       Buffer | ReadableStream | Blob | ArrayBuffer
  videoName?:   string
  frame1?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame1Name?:  string
  frame2?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame2Name?:  string
  frame3?:      Buffer | ReadableStream | Blob | ArrayBuffer
  frame3Name?:  string

  /** Document type string, e.g. "passport", "national_id". */
  documentType: string
  /** ISO 3166-1 alpha-3 country code, e.g. "KEN". */
  country:      string
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
  fields:        DocumentFields
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
  /** First face image — sent as field `face_a`. */
  faceA:      Buffer | ReadableStream | Blob | ArrayBuffer
  faceAName?: string
  /** Second face image — sent as field `face_b`. */
  faceB:      Buffer | ReadableStream | Blob | ArrayBuffer
  faceBName?: string
}

export interface FaceMatchResponse {
  matched:      boolean
  confidence:   number
  processed_at: string
}

// ── Liveness ──────────────────────────────────────────────────────────────────

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

export interface LivenessCheckRequest {
  /** Liveness video (MP4, MOV, WebM). Takes priority over frames. */
  video?:      Buffer | ReadableStream | Blob | ArrayBuffer
  videoName?:  string
  /** Low-bandwidth alternative: 3 JPEG frames instead of a video. */
  frame1?:     Buffer | ReadableStream | Blob | ArrayBuffer
  frame1Name?: string
  frame2?:     Buffer | ReadableStream | Blob | ArrayBuffer
  frame2Name?: string
  frame3?:     Buffer | ReadableStream | Blob | ArrayBuffer
  frame3Name?: string
}

export interface LivenessCheckResponse {
  passed:       boolean
  confidence?:  number
  details?:     LivenessDetails
  processed_at: string
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export interface DailyUsage {
  date:  string  // ISO 8601 date, e.g. "2025-07-10"
  count: number
}

export interface UsageSummary {
  total_calls: number
  days:        number
  daily:       DailyUsage[]
}
