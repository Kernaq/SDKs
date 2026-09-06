/**
 * @kernaq/verify-react-native — public types
 */

export type VerifyStep =
  | 'intro'
  | 'document'
  | 'selfie'
  | 'liveness'
  | 'processing'
  | 'result'

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'driver_license'
  | 'alien_card'

export type VerifyVerdict = 'pass' | 'fail' | 'review'

export interface VerifyResult {
  verificationId: string
  reference: string
  verdict: VerifyVerdict
  score: number
  faceMatch: boolean
  isLive: boolean
  documentFields?: Record<string, string>
}

export interface VerifyTheme {
  /** Primary accent colour. Default: #111827 */
  accentColor?: string
  /** Modal background. Default: #ffffff */
  backgroundColor?: string
  /** Primary text colour. Default: #111827 */
  textColor?: string
  /** Subtle text colour. Default: #6b7280 */
  subtextColor?: string
  /** Border/divider colour. Default: #e5e7eb */
  borderColor?: string
  /** Card/surface colour. Default: #f9fafb */
  cardColor?: string
  /** Border radius for buttons and cards. Default: 12 */
  borderRadius?: number
  /** 'light' | 'dark' — overrides bg/text when set */
  mode?: 'light' | 'dark'
}

export interface VerifyLocale {
  intro_title: string
  intro_body: string
  intro_cta: string
  doc_title: string
  doc_instruction: string
  doc_capture_btn: string
  doc_retake_btn: string
  doc_next_btn: string
  selfie_title: string
  selfie_instruction: string
  selfie_capture_btn: string
  selfie_retake_btn: string
  selfie_next_btn: string
  liveness_title: string
  liveness_instruction: string
  liveness_start_btn: string
  liveness_recording: string
  processing_title: string
  processing_subtitle: string
  result_pass_title: string
  result_pass_body: string
  result_fail_title: string
  result_fail_body: string
  result_review_title: string
  result_review_body: string
  result_retry_btn: string
  error_camera_denied: string
  error_quality: string
  error_network: string
}

export interface VerifyConfig {
  /**
   * Your Kernaq publishable API key (k_test_... or k_live_...).
   * For production use a backend proxy and pass backendUrl instead.
   */
  apiKey?: string

  /**
   * URL of your backend proxy that forwards to the Kernaq Identity API.
   * POST /verify with multipart/form-data.
   */
  backendUrl?: string

  /** Document types the user can select. Default: ['national_id', 'passport'] */
  documentTypes?: DocumentType[]

  /** Country code (ISO 3166-1 alpha-3). Default: 'KEN' */
  country?: string

  /** Your internal reference ID for this user/session */
  reference?: string

  /** Use sandbox mode — no billing, test responses */
  sandbox?: boolean

  /** Liveness recording duration in ms. Default: 3000 */
  livenessDuration?: number

  /** Theming */
  theme?: VerifyTheme

  /** Override any displayed string */
  locale?: Partial<VerifyLocale>

  /** Called when the user dismisses without completing */
  onCancel?: () => void

  /** Called when verification is complete */
  onComplete?: (result: VerifyResult) => void

  /** Called on unrecoverable error */
  onError?: (error: { code: string; message: string }) => void
}
