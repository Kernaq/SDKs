// Package kernaq provides the official Go client for the Kernaq Identity API.
// Response shapes are confirmed against the live API spec (OpenAPI 1.0.0, July 2026).
package kernaq

import "time"

// ── Config ────────────────────────────────────────────────────────────────────

// Config holds client configuration.
// All fields fall back to environment variables.
type Config struct {
	// APIKey is your Kernaq API key (k_live_… or k_test_…).
	// Falls back to KERNAQ_API_KEY env var.
	APIKey string

	// BaseURL overrides the default API base URL.
	// Falls back to KERNAQ_API_URL env var, then https://api.kernaq.com/v1.
	BaseURL string

	// Timeout is the HTTP request timeout. Default: 120s.
	Timeout time.Duration
}

// ── Document types ────────────────────────────────────────────────────────────

// DocumentType enumerates all supported ID document types.
type DocumentType string

const (
	// Core identity
	DocumentTypeNationalID           DocumentType = "national_id"
	DocumentTypePassport             DocumentType = "passport"
	DocumentTypeDriverLicense        DocumentType = "driver_license"
	DocumentTypeResidencePermit      DocumentType = "residence_permit"
	DocumentTypeBusinessRegistration DocumentType = "business_registration"

	// East Africa
	DocumentTypeAlienCard          DocumentType = "alien_card"
	DocumentTypeKRAPinCertificate  DocumentType = "kra_pin_certificate"
	DocumentTypeSHACard            DocumentType = "sha_card"
	DocumentTypeNHIFCard           DocumentType = "nhif_card" // alias — server normalises to sha_card
	DocumentTypeVoterID            DocumentType = "voter_id"
	DocumentTypeRefugeeID          DocumentType = "refugee_id"
	DocumentTypeForeignNationalID  DocumentType = "foreign_national_id"
	DocumentTypeMilitaryID         DocumentType = "military_id"
	DocumentTypeStudentID          DocumentType = "student_id"

	// AML / proof of address
	DocumentTypeUtilityBill        DocumentType = "utility_bill"
	DocumentTypeBankStatement      DocumentType = "bank_statement"
	DocumentTypeProofOfAddress     DocumentType = "proof_of_address"
	DocumentTypeTaxDocument        DocumentType = "tax_document"
	DocumentTypeEmploymentLetter   DocumentType = "employment_letter"
	DocumentTypeVehicleRegistration DocumentType = "vehicle_registration"
	DocumentTypeTenancyAgreement   DocumentType = "tenancy_agreement"
	DocumentTypeOther              DocumentType = "other"
)

// ── Verification status ───────────────────────────────────────────────────────

// VerificationStatus represents the pipeline state of a verification.
type VerificationStatus string

const (
	VerificationStatusPending    VerificationStatus = "pending"
	VerificationStatusProcessing VerificationStatus = "processing"
	VerificationStatusVerified   VerificationStatus = "verified"
	VerificationStatusFailed     VerificationStatus = "failed"
	VerificationStatusReview     VerificationStatus = "review"
)

// FailureReason is set on the verification record when Status == "failed".
type FailureReason string

const (
	FailureReasonPipelineTimeout FailureReason = "pipeline_timeout"
	FailureReasonPipelineError   FailureReason = "pipeline_error"
	FailureReasonFaceMismatch    FailureReason = "face_mismatch"
	FailureReasonLivenessFailed  FailureReason = "liveness_failed"
	FailureReasonDocumentInvalid FailureReason = "document_invalid"
	FailureReasonHighRisk        FailureReason = "high_risk"
	FailureReasonFraudDetected   FailureReason = "fraud_detected"
)

// ── Error ─────────────────────────────────────────────────────────────────────

// Error is returned by all SDK methods on non-2xx responses.
type Error struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
}

func (e *Error) Error() string { return e.Message }

// ── Verification ──────────────────────────────────────────────────────────────

// SubmitVerificationRequest is the input to Verifications.Submit.
type SubmitVerificationRequest struct {
	// Document is the government-issued ID image (JPEG, PNG, PDF, HEIC).
	Document     FileInput
	DocumentName string // defaults to "document.jpg"

	// Selfie is the portrait photo.
	Selfie     FileInput
	SelfieName string // defaults to "selfie.jpg"

	// ── Liveness — provide Video OR all three Frame fields ────────────────
	// Video is the standard liveness video (MP4, MOV, WebM).
	Video     FileInput
	VideoName string // defaults to "liveness.mp4"

	// Frame-sequence liveness — low-bandwidth alternative for 2G/3G devices.
	// Provide all three frames instead of a video.
	Frame1     FileInput
	Frame1Name string
	Frame2     FileInput
	Frame2Name string
	Frame3     FileInput
	Frame3Name string

	DocumentType   DocumentType
	Country        string // ISO 3166-1 alpha-3, e.g. "KEN"
	Reference      string // your unique reference — idempotency key, 1–255 chars [a-zA-Z0-9_-.]
	ExternalUserID string // optional

	// DPA 2019 consent metadata — optional, stored immutably for audit trail.
	ConsentReference string
	ConsentAt        string // ISO 8601 datetime
	ConsentType      string // e.g. "explicit", "legitimate_interest"

	// Capture session — required when project.RequireCaptureToken == true.
	CaptureToken string
	CaptureNonce string
}

// SubmitVerificationResponse is returned immediately (HTTP 202).
type SubmitVerificationResponse struct {
	VerificationID string             `json:"verification_id"`
	Reference      string             `json:"reference"`
	Status         VerificationStatus `json:"status"`
	Message        string             `json:"message"`
}

// VerificationStatusResponse is the lightweight status poll result.
type VerificationStatusResponse struct {
	VerificationID string             `json:"verification_id"`
	Status         VerificationStatus `json:"status"`
	// FailureReason is set when Status == VerificationStatusFailed.
	FailureReason FailureReason `json:"failure_reason,omitempty"`
}

// ExtractedFields contains parsed identity data from the document.
type ExtractedFields struct {
	FirstName      string                 `json:"first_name,omitempty"`
	LastName       string                 `json:"last_name,omitempty"`
	DocumentNumber string                 `json:"document_number,omitempty"`
	DateOfBirth    string                 `json:"date_of_birth,omitempty"`
	ExpiryDate     string                 `json:"expiry_date,omitempty"`
	Country        string                 `json:"country,omitempty"`
	RawFields      map[string]interface{} `json:"raw_fields,omitempty"`
}

// VerificationDocument holds the document analysis result.
type VerificationDocument struct {
	Valid         bool             `json:"valid"`
	Type          string           `json:"type"`
	ExtractedData *ExtractedFields `json:"extracted_data,omitempty"`
}

// VerificationFace holds the face match result.
type VerificationFace struct {
	Matched    bool    `json:"matched"`
	Confidence float64 `json:"confidence"`
}

// VerificationLiveness holds the liveness check result.
type VerificationLiveness struct {
	Passed bool `json:"passed"`
}

// LivenessDetails contains movement analysis from the liveness check.
type LivenessDetails struct {
	Mode             string  `json:"mode"`              // "video" | "frame_sequence"
	DetectedFrames   int     `json:"detected_frames"`
	ExtractedFrames  int     `json:"extracted_frames"`
	DeltaYaw         float64 `json:"delta_yaw"`
	DeltaPitch       float64 `json:"delta_pitch"`
	DeltaRoll        float64 `json:"delta_roll"`
	MovementDetected bool    `json:"movement_detected"`
}

// VerificationRisk holds the risk scoring result.
type VerificationRisk struct {
	Level string `json:"level"` // "low" | "medium" | "high" | "unknown"
}

// VerificationResult is the full pipeline result from GET /verifications/:id.
type VerificationResult struct {
	VerificationID string                `json:"verification_id"`
	Status         VerificationStatus    `json:"status"`
	// FailureReason explains why the verification failed. Empty when Status != "failed".
	FailureReason  FailureReason         `json:"failure_reason,omitempty"`
	Confidence     float64               `json:"confidence,omitempty"`
	Document       *VerificationDocument `json:"document,omitempty"`
	Face           *VerificationFace     `json:"face,omitempty"`
	Liveness       *VerificationLiveness `json:"liveness,omitempty"`
	Risk           *VerificationRisk     `json:"risk,omitempty"`
}

// VerificationSummary is the lightweight shape in list responses.
type VerificationSummary struct {
	VerificationID string             `json:"verification_id"`
	Reference      string             `json:"reference"`
	Status         VerificationStatus `json:"status"`
	FailureReason  FailureReason      `json:"failure_reason,omitempty"`
	Confidence     float64            `json:"confidence,omitempty"`
	CreatedAt      time.Time          `json:"created_at"`
}

// ListVerificationsResponse is returned by GET /verifications.
type ListVerificationsResponse struct {
	Verifications []VerificationSummary `json:"verifications"`
	NextCursor    string                `json:"next_cursor,omitempty"`
}

// ListVerificationsOptions configures the list query.
type ListVerificationsOptions struct {
	Limit  int
	Before string             // keyset cursor from a previous NextCursor
	Status VerificationStatus // filter by status; empty means all
}

// PollOptions configures SubmitAndWait behaviour.
type PollOptions struct {
	Interval time.Duration          // default 2s
	Timeout  time.Duration          // default 3m
	OnStatus func(VerificationStatus)
}

// ── Documents ─────────────────────────────────────────────────────────────────

// ExtractDocumentRequest is the input to Documents.Extract.
type ExtractDocumentRequest struct {
	Document     FileInput
	DocumentName string
	DocumentType DocumentType
	Country      string
}

// ExtractDocumentResponse is returned by POST /documents/extract.
type ExtractDocumentResponse struct {
	DocumentType string          `json:"document_type"`
	Fields       ExtractedFields `json:"fields"`
	RawLines     []string        `json:"raw_lines,omitempty"`
	ProcessedAt  string          `json:"processed_at"`
}

// ValidateDocumentRequest is the input to Documents.Validate.
type ValidateDocumentRequest struct {
	Document     FileInput
	DocumentName string
	DocumentType DocumentType
	Country      string
}

// ValidateDocumentResponse is returned by POST /documents/validate.
type ValidateDocumentResponse struct {
	Valid        bool     `json:"valid"`
	DocumentType string   `json:"document_type"`
	Flags        []string `json:"flags,omitempty"`
	ProcessedAt  string   `json:"processed_at"`
}

// ── Face ──────────────────────────────────────────────────────────────────────

// FaceDetectRequest is the input to Face.Detect.
type FaceDetectRequest struct {
	Image     FileInput
	ImageName string
}

// BoundingBox represents a face position within an image.
type BoundingBox struct {
	Left   float64 `json:"left"`
	Top    float64 `json:"top"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// FaceDetectResponse is returned by POST /face/detect.
type FaceDetectResponse struct {
	Detected     bool                   `json:"detected"`
	Confidence   float64                `json:"confidence"`
	BoundingBox  *BoundingBox           `json:"bounding_box,omitempty"`
	AgeRangeLow  int                    `json:"age_range_low,omitempty"`
	AgeRangeHigh int                    `json:"age_range_high,omitempty"`
	Gender       string                 `json:"gender,omitempty"`
	Attributes   map[string]interface{} `json:"attributes,omitempty"`
	ProcessedAt  string                 `json:"processed_at"`
}

// FaceMatchRequest is the input to Face.Match.
type FaceMatchRequest struct {
	ImageA     FileInput
	ImageAName string
	ImageB     FileInput
	ImageBName string
}

// FaceMatchResponse is returned by POST /face/match.
type FaceMatchResponse struct {
	Matched     bool    `json:"matched"`
	Confidence  float64 `json:"confidence"`
	ProcessedAt string  `json:"processed_at"`
}

// ── Liveness ──────────────────────────────────────────────────────────────────

// LivenessCheckRequest is the input to Liveness.Check.
type LivenessCheckRequest struct {
	Video     FileInput
	VideoName string
}

// LivenessCheckResponse is returned by POST /liveness/check.
type LivenessCheckResponse struct {
	Passed      bool             `json:"passed"`
	Confidence  float64          `json:"confidence,omitempty"`
	Details     *LivenessDetails `json:"details,omitempty"`
	ProcessedAt string           `json:"processed_at"`
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

// WebhookEvent is the set of subscribable event types.
type WebhookEvent string

const (
	WebhookEventVerificationCompleted WebhookEvent = "verification.completed"
	WebhookEventVerificationFailed    WebhookEvent = "verification.failed"
	WebhookEventVerificationReview    WebhookEvent = "verification.review"
)

// CreateWebhookRequest is the input to Webhooks.Create.
type CreateWebhookRequest struct {
	URL    string         `json:"url"`
	Events []WebhookEvent `json:"events"`
}

// WebhookCreatedResponse is returned on creation. Secret shown once — store it.
type WebhookCreatedResponse struct {
	ID        string         `json:"id"`
	URL       string         `json:"url"`
	Events    []WebhookEvent `json:"events"`
	IsActive  bool           `json:"is_active"`
	Secret    string         `json:"secret"` // HMAC-SHA256 signing secret — shown once
	CreatedAt time.Time      `json:"created_at"`
	Message   string         `json:"message"`
}

// Webhook is the safe shape returned by list/get (secret never returned).
type Webhook struct {
	ID        string         `json:"id"`
	URL       string         `json:"url"`
	Events    []WebhookEvent `json:"events"`
	IsActive  bool           `json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
}

// WebhookListResponse is returned by GET /webhooks.
type WebhookListResponse struct {
	Webhooks []Webhook `json:"webhooks"`
	Total    int       `json:"total"`
}

// UpdateWebhookRequest is the input to Webhooks.Update. All fields optional.
type UpdateWebhookRequest struct {
	URL      string         `json:"url,omitempty"`
	Events   []WebhookEvent `json:"events,omitempty"`
	IsActive *bool          `json:"is_active,omitempty"`
}

// RotateSecretResponse is returned by POST /webhooks/:id/rotate-secret.
type RotateSecretResponse struct {
	ID      string `json:"id"`
	Secret  string `json:"secret"`
	Message string `json:"message"`
}

// WebhookDeliveryStatus represents the state of a delivery attempt.
type WebhookDeliveryStatus string

const (
	WebhookDeliveryStatusPending   WebhookDeliveryStatus = "pending"
	WebhookDeliveryStatusDelivered WebhookDeliveryStatus = "delivered"
	WebhookDeliveryStatusFailed    WebhookDeliveryStatus = "failed"
	WebhookDeliveryStatusAbandoned WebhookDeliveryStatus = "abandoned"
)

// WebhookDelivery is a single delivery attempt row.
type WebhookDelivery struct {
	ID          string                `json:"id"`
	EventType   string                `json:"event_type"`
	EventID     string                `json:"event_id"`
	Status      WebhookDeliveryStatus `json:"status"`
	Attempts    int                   `json:"attempts"`
	MaxAttempts int                   `json:"max_attempts"`
	NextAttempt *time.Time            `json:"next_attempt,omitempty"`
	LastError   string                `json:"last_error,omitempty"`
	DeliveredAt *time.Time            `json:"delivered_at,omitempty"`
	CreatedAt   time.Time             `json:"created_at"`
}

// WebhookDeliveryListResponse is returned by GET /webhooks/:id/deliveries.
type WebhookDeliveryListResponse struct {
	Deliveries []WebhookDelivery `json:"deliveries"`
	Total      int               `json:"total"`
}

// ── Capture sessions ──────────────────────────────────────────────────────────

// CreateCaptureSessionRequest is the input to Capture.CreateSession.
type CreateCaptureSessionRequest struct {
	// Reference ties the session to a user or flow (same as verification reference).
	Reference  string `json:"reference"`
	DeviceInfo string `json:"device_info,omitempty"`
}

// CaptureSessionResponse is returned by POST /capture/sessions.
type CaptureSessionResponse struct {
	SessionID  string    `json:"session_id"`
	// Token is the 64-char hex token. Pass to the capture SDK as X-Capture-Token.
	// Never log or store it.
	Token      string    `json:"token"`
	// Nonce is the 32-char hex anti-replay value. Pass as X-Capture-Nonce. Single-use.
	Nonce      string    `json:"nonce"`
	ExpiresAt  time.Time `json:"expires_at"`
	TTLSeconds int       `json:"ttl_seconds"`
	Message    string    `json:"message"`
}

// ── Project settings ──────────────────────────────────────────────────────────

// ProjectSettings holds per-project risk and security configuration.
type ProjectSettings struct {
	ProjectID                 string    `json:"project_id"`
	RiskThresholdMedium       float64   `json:"risk_threshold_medium"`
	RiskThresholdHigh         float64   `json:"risk_threshold_high"`
	MaxAttemptsPerReference   int       `json:"max_attempts_per_reference"`
	RequireCaptureToken       bool      `json:"require_capture_token"`
	EnableCrossProjectDedup   bool      `json:"enable_cross_project_dedup"`
	CreatedAt                 time.Time `json:"created_at"`
	UpdatedAt                 time.Time `json:"updated_at"`
}

// UpdateSettingsRequest is the input to Settings.Update. All fields optional.
type UpdateSettingsRequest struct {
	RiskThresholdMedium       *float64 `json:"risk_threshold_medium,omitempty"`
	RiskThresholdHigh         *float64 `json:"risk_threshold_high,omitempty"`
	MaxAttemptsPerReference   *int     `json:"max_attempts_per_reference,omitempty"`
	RequireCaptureToken       *bool    `json:"require_capture_token,omitempty"`
	EnableCrossProjectDedup   *bool    `json:"enable_cross_project_dedup,omitempty"`
}
