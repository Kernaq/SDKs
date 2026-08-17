package kernaq

import (
	"context"
	"fmt"
	"io"
)

// VerifyResource handles the synchronous KYC pipeline.
// POST /v1/verify and POST /v1/verify/sandbox.
type VerifyResource struct {
	c *client
}

// VerifyInput is the input to Verify.Run and Verify.Sandbox.
type VerifyInput struct {
	// Document is the government-issued ID photo (JPEG, PNG, PDF).
	Document         io.Reader
	DocumentFilename string // default: "document.jpg"

	// Selfie is the portrait face photo.
	Selfie         io.Reader
	SelfieFilename string // default: "selfie.jpg"

	// Liveness: supply Video OR all three Frame fields (low-bandwidth).
	Video         io.Reader
	VideoFilename string // default: "liveness.mp4"

	Frame1         io.Reader
	Frame1Filename string
	Frame2         io.Reader
	Frame2Filename string
	Frame3         io.Reader
	Frame3Filename string

	// DocumentType: "national_id", "passport", "driver_license", etc.
	DocumentType string
	// Country: ISO 3166-1 alpha-3, e.g. "KEN".
	Country string
}

// VerifyResult is returned synchronously by Run and Sandbox.
// Built in-memory by the server, returned in the HTTP response, never stored.
type VerifyResult struct {
	RequestID      string         `json:"request_id"`
	Verdict        string         `json:"verdict"`          // "pass" | "fail" | "review"
	Score          int            `json:"score"`            // 0–100
	FaceMatch      bool           `json:"face_match"`
	FaceConfidence float64        `json:"face_confidence"`
	LivenessPass   bool           `json:"liveness_pass"`
	DocumentFields DocumentFields `json:"document_fields"`
	FraudFlags     []string       `json:"fraud_flags"`
	FailureReason  string         `json:"failure_reason,omitempty"`
	DurationMs     int64          `json:"duration_ms"`
}

// Run submits a full KYC verification in live mode.
// Deducts one credit. Blocks 3–8 seconds. Returns the result directly.
// Nothing is stored on Kernaq servers.
//
// Example:
//
//	result, err := client.Verify.Run(ctx, kernaq.VerifyInput{
//	    Document:     docFile,
//	    Selfie:       selfieFile,
//	    Video:        videoFile,
//	    DocumentType: "national_id",
//	    Country:      "KEN",
//	})
//	if err != nil { ... }
//	if result.Verdict == "pass" {
//	    fmt.Println(result.DocumentFields.Name)
//	}
func (r *VerifyResource) Run(ctx context.Context, input VerifyInput) (*VerifyResult, error) {
	return r.submit(ctx, "/verify", input)
}

// Sandbox submits a full KYC verification in sandbox mode.
// Same pipeline, no billing. Use k_test_ API keys.
func (r *VerifyResource) Sandbox(ctx context.Context, input VerifyInput) (*VerifyResult, error) {
	return r.submit(ctx, "/verify/sandbox", input)
}

func (r *VerifyResource) submit(ctx context.Context, path string, input VerifyInput) (*VerifyResult, error) {
	fields := map[string]string{
		"document_type": input.DocumentType,
		"country":       input.Country,
	}

	docFilename  := nameOr(input.DocumentFilename, "document.jpg")
	selfFilename := nameOr(input.SelfieFilename,   "selfie.jpg")

	files := []filePart{
		{field: "document", reader: input.Document, filename: docFilename,  mime: mimeFromName(docFilename)},
		{field: "selfie",   reader: input.Selfie,   filename: selfFilename, mime: mimeFromName(selfFilename)},
	}

	if input.Video != nil {
		vidFilename := nameOr(input.VideoFilename, "liveness.mp4")
		files = append(files, filePart{
			field: "video", reader: input.Video, filename: vidFilename, mime: mimeFromName(vidFilename),
		})
	} else if input.Frame1 != nil && input.Frame2 != nil && input.Frame3 != nil {
		f1 := nameOr(input.Frame1Filename, "frame1.jpg")
		f2 := nameOr(input.Frame2Filename, "frame2.jpg")
		f3 := nameOr(input.Frame3Filename, "frame3.jpg")
		files = append(files,
			filePart{field: "frame1", reader: input.Frame1, filename: f1, mime: "image/jpeg"},
			filePart{field: "frame2", reader: input.Frame2, filename: f2, mime: "image/jpeg"},
			filePart{field: "frame3", reader: input.Frame3, filename: f3, mime: "image/jpeg"},
		)
	}

	var out VerifyResult
	if err := r.c.upload(ctx, path, fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UsageResource handles GET /v1/usage and GET /v1/logs.
type UsageResource struct {
	c *client
}

// Get returns aggregate non-PII usage statistics.
// days: number of days to include (1–365, default 30).
func (r *UsageResource) Get(ctx context.Context, days int) (*UsageSummary, error) {
	if days <= 0 {
		days = 30
	}
	var out UsageSummary
	if err := r.c.get(ctx, fmt.Sprintf("/usage?period=%dd", days), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetLogs returns paginated raw API call logs (no PII).
// Each entry has endpoint, status_code, duration_ms, created_at.
func (r *UsageResource) GetLogs(ctx context.Context, limit, offset int) (*LogsResponse, error) {
	if limit <= 0 {
		limit = 50
	}
	var out LogsResponse
	if err := r.c.get(ctx, fmt.Sprintf("/logs?limit=%d&offset=%d", limit, offset), &out); err != nil {
		return nil, err
	}
	return &out, nil
}
