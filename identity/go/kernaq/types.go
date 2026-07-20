// Package kernaq provides the Kernaq Identity API client for Go.
// Response shapes are confirmed against the live API (34/34 tests, July 2026).
package kernaq

import "time"

// ── Config ────────────────────────────────────────────────────────────────────

// Config holds client configuration.
// All fields can be set via environment variables as a fallback.
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

// DocumentType enumerates the supported ID document types.
type DocumentType string

const (
	DocumentTypeNationalID           DocumentType = "national_id"
	DocumentTypePassport             DocumentType = "passport"
	DocumentTypeDriverLicense        DocumentType = "driver_license"
	DocumentTypeResidencePermit      DocumentType = "residence_permit"
	DocumentTypeBusinessRegistration DocumentType = "business_registration"
)

// VerificationStatus represents the pipeline state of a verification.
type VerificationStatus string

const (
	VerificationStatusPending    VerificationStatus = "pending"
	VerificationStatusProcessing VerificationStatus = "processing"
	VerificationStatusVerified   VerificationStatus = "verified"
	VerificationStatusFailed     VerificationStatus = "failed"
	VerificationStatusReview     VerificationStatus = "review"
)

// ── Error ─────────────────────────────────────────────────────────────────────

// Error is returned by all SDK methods on non-2xx responses.
type Error struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
}

func (e *Error) Error() string {
	return e.Message
}

// ── Verification ──────────────────────────────────────────────────────────────

// SubmitVerificationRequest is the input to Verifications.Submit.
type SubmitVerificationRequest struct {
	// Document is the government-issued ID image reader (JPEG, PNG, PDF, HEIC).
	Document     FileInput
	DocumentName string // defaults to "document.jpg"

	// Selfie is the portrait photo reader.
	Selfie     FileInput
	SelfieName string // defaults to "selfie.jpg"

	// Video is the liveness video reader (MP4, MOV, WebM).
	Video     FileInput
	VideoName string // defaults to "liveness.mp4"

	DocumentType   DocumentType
	Country        string // ISO 3166-1 alpha-3, e.g. "KEN"
	Reference      string // your unique ID for this user
	ExternalUserID string // optional
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

// VerificationRisk holds the risk scoring result.
type VerificationRisk struct {
	Level string `json:"level"`
}

// VerificationResult is the full pipeline result from GET /verifications/:id.
type VerificationResult struct {
	VerificationID string                `json:"verification_id"`
	Status         VerificationStatus    `json:"status"`
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
	Before string // cursor from a previous response
}

// PollOptions configures the submitAndWait behaviour.
type PollOptions struct {
	// Interval between polls. Default: 2s.
	Interval time.Duration
	// Timeout waiting for completion. Default: 3m.
	Timeout time.Duration
	// OnStatus is called on each poll with the current status.
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
	Matched    bool    `json:"matched"`
	Confidence float64 `json:"confidence"`
}

// ── Liveness ──────────────────────────────────────────────────────────────────

// LivenessCheckRequest is the input to Liveness.Check.
type LivenessCheckRequest struct {
	Video     FileInput
	VideoName string
}

// LivenessCheckResponse is returned by POST /liveness/check.
type LivenessCheckResponse struct {
	Passed     bool    `json:"passed"`
	Confidence float64 `json:"confidence,omitempty"`
	Reason     string  `json:"reason,omitempty"`
}
