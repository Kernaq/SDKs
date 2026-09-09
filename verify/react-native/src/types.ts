/**
 * @kernaq/verify-react-native — public types (v2)
 */

export type VerifyStep =
  | 'intro'
  | 'doc-front'
  | 'doc-back'
  | 'selfie'
  | 'liveness'
  | 'processing'
  | 'result'

/** Which capture steps to include. Default: all three. */
export type VerifyStepName = 'document' | 'selfie' | 'liveness'

/** Liveness challenge tasks */
export type LivenessTask = 'blink' | 'turn-left' | 'turn-right' | 'nod' | 'open-mouth'

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
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  subtextColor?: string
  borderColor?: string
  cardColor?: string
  borderRadius?: number
  /** 'light' | 'dark' */
  mode?: 'light' | 'dark'
}

export interface VerifyLocale {
  intro_title: string
  intro_body: string
  intro_cta: string
  doc_front_title: string
  doc_front_instruction: string
  doc_back_title: string
  doc_back_instruction: string
  doc_capture_btn: string
  doc_retake_btn: string
  selfie_title: string
  selfie_instruction: string
  liveness_title: string
  liveness_ready: string
  liveness_task_prefix: string
  liveness_complete: string
  processing_title: string
  result_pass_title: string
  result_pass_body: string
  result_fail_title: string
  result_fail_body: string
  result_review_title: string
  result_review_body: string
  error_camera_denied: string
  error_blur: string
  error_quality: string
  error_network: string
}

export interface VerifyConfig {
  apiKey?: string
  backendUrl?: string
  /** Single document type the developer specifies. Default: 'national_id' */
  documentType?: DocumentType
  country?: string
  reference?: string
  sandbox?: boolean
  livenessDuration?: number
  /** Number of liveness tasks. Default: 2 */
  livenessTaskCount?: number
  /**
   * Which steps to include. Default: all three.
   * @example steps={['selfie', 'liveness']}
   */
  steps?: VerifyStepName[]
  theme?: VerifyTheme
  locale?: Partial<VerifyLocale>
  onCancel?: () => void
  onComplete?: (result: VerifyResult) => void
  onError?: (error: { code: string; message: string }) => void
}
