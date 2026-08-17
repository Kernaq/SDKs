// Package kernaq provides the official Go client for the Kernaq Identity API.
// Process-and-forget model v2.
package kernaq

import "time"

// ── Config ────────────────────────────────────────────────────────────────────

// Config holds client configuration.
// All fields fall back to environment variables when empty.
type Config struct {
	// APIKey is your Kernaq API key (k_live_… or k_test_…).
	// Falls back to KERNAQ_API_KEY env var.
	APIKey string

	// BaseURL overrides the default API base URL.
	// Falls back to KERNAQ_API_URL env var, then https://api.identity.kernaq.com/v1.
	BaseURL string

	// Timeout is the HTTP request timeout. Default: 120s.
	Timeout time.Duration
}

// ── Errors ────────────────────────────────────────────────────────────────────

// Error is returned by all SDK methods on non-2xx responses.
type Error struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
}

func (e *Error) Error() string { return e.Message }

// ── Document types ────────────────────────────────────────────────────────────

// DocumentType is the string identifier for a supported ID document.
// Pass to VerifyInput.DocumentType or ExtractDocumentRequest.DocumentType.
type DocumentType = string

const (
	// Core identity documents
	DocumentTypeNationalID           DocumentType = "national_id"
	DocumentTypePassport             DocumentType = "passport"
	DocumentTypeDriverLicense        DocumentType = "driver_license"
	DocumentTypeResidencePermit      DocumentType = "residence_permit"
	DocumentTypeBusinessRegistration DocumentType = "business_registration"

	// East Africa specific
	DocumentTypeAlienCard           DocumentType = "alien_card"
	DocumentTypeKRAPinCertificate   DocumentType = "kra_pin_certificate"
	DocumentTypeSHACard             DocumentType = "sha_card"
	DocumentTypeNHIFCard            DocumentType = "nhif_card" // normalised to sha_card server-side
	DocumentTypeVoterID             DocumentType = "voter_id"
	DocumentTypeRefugeeID           DocumentType = "refugee_id"
	DocumentTypeForeignNationalID   DocumentType = "foreign_national_id"
	DocumentTypeMilitaryID          DocumentType = "military_id"
	DocumentTypeStudentID           DocumentType = "student_id"

	// AML / proof of address
	DocumentTypeUtilityBill         DocumentType = "utility_bill"
	DocumentTypeBankStatement       DocumentType = "bank_statement"
	DocumentTypeProofOfAddress      DocumentType = "proof_of_address"
	DocumentTypeTaxDocument         DocumentType = "tax_document"
	DocumentTypeEmploymentLetter    DocumentType = "employment_letter"
	DocumentTypeVehicleRegistration DocumentType = "vehicle_registration"
	DocumentTypeTenancyAgreement    DocumentType = "tenancy_agreement"
	DocumentTypeOther               DocumentType = "other"
)

// ── Verdict ───────────────────────────────────────────────────────────────────

// Verdict is the top-level outcome of a verification call.
type Verdict = string

const (
	VerdictPass   Verdict = "pass"   // face matched, liveness passed, doc valid, risk ≤ 20
	VerdictFail   Verdict = "fail"   // one or more hard checks failed — see FailureReason
	VerdictReview Verdict = "review" // risk score 21–60, manual review recommended
)

// ── Failure reasons ───────────────────────────────────────────────────────────

// FailureReason explains why a verification returned verdict "fail".
// Set on VerifyResult.FailureReason.
type FailureReason = string

const (
	FailureFaceMismatch    FailureReason = "face_mismatch"
	FailureLivenessFailed  FailureReason = "liveness_failed"
	FailureDocumentInvalid FailureReason = "document_invalid"
	FailureHighRisk        FailureReason = "high_risk"
	FailurePipelineError   FailureReason = "pipeline_error"
)

// ── Document fields ───────────────────────────────────────────────────────────

// DocumentFields contains OCR-extracted text from the ID document.
// Returned to the caller in VerifyResult — never stored by Kernaq.
type DocumentFields struct {
	Name           string `json:"name"`
	DateOfBirth    string `json:"date_of_birth"`
	DocumentNumber string `json:"document_number"`
	ExpiryDate     string `json:"expiry_date"`
	Country        string `json:"country"`
	DocumentType   string `json:"document_type"`
	Nationality    string `json:"nationality"`
	Gender         string `json:"gender"`
	IsValid        bool   `json:"is_valid"`
}

// ── Extract / Validate ────────────────────────────────────────────────────────

// ExtractDocumentRequest is the input to Documents.Extract.
type ExtractDocumentRequest struct {
	Document     FileInput
	DocumentName string
	DocumentType DocumentType
	Country      string
}

// ExtractDocumentResponse is returned by POST /v1/documents/extract.
type ExtractDocumentResponse struct {
	DocumentType   string `json:"document_type"`
	Country        string `json:"country"`
	DocumentNumber string `json:"document_number"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	DateOfBirth    string `json:"date_of_birth"`
	ExpiryDate     string `json:"expiry_date"`
}

// ValidateDocumentRequest is the input to Documents.Validate.
type ValidateDocumentRequest struct {
	Document     FileInput
	DocumentName string
	DocumentType DocumentType
	Country      string
}

// ValidateDocumentResponse is returned by POST /v1/documents/validate.
type ValidateDocumentResponse struct {
	Valid          bool   `json:"valid"`
	Reason         string `json:"reason"`
	DocumentNumber string `json:"document_number"`
	ExpiryDate     string `json:"expiry_date"`
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

// FaceDetectResponse is returned by POST /v1/face/detect.
type FaceDetectResponse struct {
	Detected     bool         `json:"detected"`
	Confidence   float64      `json:"confidence"`
	BoundingBox  *BoundingBox `json:"bounding_box,omitempty"`
	AgeRangeLow  int          `json:"age_range_low,omitempty"`
	AgeRangeHigh int          `json:"age_range_high,omitempty"`
	Gender       string       `json:"gender,omitempty"`
	Smile        bool         `json:"smile"`
	Sunglasses   bool         `json:"sunglasses"`
	EyesOpen     bool         `json:"eyes_open"`
}

// FaceMatchRequest is the input to Face.Match.
// ImageA is sent as form field "face_a", ImageB as "face_b".
type FaceMatchRequest struct {
	ImageA     FileInput
	ImageAName string
	ImageB     FileInput
	ImageBName string
}

// FaceMatchResponse is returned by POST /v1/face/match.
type FaceMatchResponse struct {
	Matched    bool    `json:"matched"`
	Confidence float64 `json:"confidence"`
}

// ── Liveness ──────────────────────────────────────────────────────────────────

// LivenessCheckRequest is the input to Liveness.Check.
// Supply Video OR all three Frame fields (low-bandwidth alternative).
type LivenessCheckRequest struct {
	// Standard path: 3–8s video (MP4, MOV, WebM)
	Video      FileInput
	VideoName  string

	// Low-bandwidth path: 3 JPEG frames instead of a video
	Frame1     FileInput
	Frame1Name string
	Frame2     FileInput
	Frame2Name string
	Frame3     FileInput
	Frame3Name string
}

// LivenessCheckResponse is returned by POST /v1/liveness/check.
type LivenessCheckResponse struct {
	Passed     bool    `json:"passed"`
	Confidence float64 `json:"confidence"`
}

// ── Usage ─────────────────────────────────────────────────────────────────────

// DailyUsage is one day's non-PII call counts.
type DailyUsage struct {
	Date    string `json:"date"`    // YYYY-MM-DD
	Total   int    `json:"total"`
	Success int    `json:"success"`
	Failed  int    `json:"failed"`
}

// UsageSummary is returned by GET /v1/usage.
type UsageSummary struct {
	TotalCalls    int          `json:"total_calls"`
	SuccessCalls  int          `json:"success_calls"`
	FailedCalls   int          `json:"failed_calls"`
	AvgDurationMs float64      `json:"avg_duration_ms"`
	ByDay         []DailyUsage `json:"by_day"`
}

// UsageLog is a single non-PII API call record from GET /v1/logs.
type UsageLog struct {
	ID         string `json:"id"`
	PartnerID  string `json:"partner_id"`
	Endpoint   string `json:"endpoint"`    // "/verify" | "/verify/sandbox" | "/documents/extract" etc.
	StatusCode int    `json:"status_code"` // 200 | 422 | 400 | 500
	DurationMs int64  `json:"duration_ms"`
	CreatedAt  string `json:"created_at"`  // RFC3339
}

// LogsResponse is returned by GET /v1/logs.
type LogsResponse struct {
	Logs   []UsageLog `json:"logs"`
	Total  int        `json:"total"`
	Limit  int        `json:"limit"`
	Offset int        `json:"offset"`
}
