// Package kernaq provides the official Go client for the Kernaq Identity API.
// Requires Go 1.22+. Zero external dependencies.
//
// # Quick start
//
//	client := kernaq.New(kernaq.Config{}) // reads KERNAQ_API_KEY + KERNAQ_API_URL from env
//
//	result, err := client.Verifications.SubmitAndWait(ctx,
//	    kernaq.SubmitVerificationRequest{
//	        Document:     docFile,
//	        Selfie:       selfieFile,
//	        Video:        videoFile,
//	        DocumentType: kernaq.DocumentTypePassport,
//	        Country:      "KEN",
//	        Reference:    "user_acct_123",
//	    }, nil)
//	if err != nil { ... }
//	if result.Status == kernaq.VerificationStatusFailed {
//	    fmt.Println(result.FailureReason) // e.g. "face_mismatch"
//	}
package kernaq

// Client is the root entry point. Create once and reuse across goroutines.
type Client struct {
	// Verifications handles the full async KYC pipeline.
	Verifications *VerificationsResource
	// Documents provides standalone document OCR and validation.
	Documents *DocumentsResource
	// Face provides standalone face detection and matching.
	Face *FaceResource
	// Liveness provides standalone liveness detection.
	Liveness *LivenessResource
	// Webhooks manages event callback registrations.
	Webhooks *WebhooksResource
	// Capture issues short-lived session tokens for the headless capture SDK.
	Capture *CaptureResource
	// Settings manages per-project risk thresholds and security configuration.
	Settings *SettingsResource
}

// New creates a Kernaq Identity API client.
// Config fields fall back to KERNAQ_API_KEY and KERNAQ_API_URL environment
// variables when empty, so a zero-value Config works in a 12-factor app.
func New(cfg Config) *Client {
	c := newClient(cfg)
	return &Client{
		Verifications: &VerificationsResource{c: c},
		Documents:     &DocumentsResource{c: c},
		Face:          &FaceResource{c: c},
		Liveness:      &LivenessResource{c: c},
		Webhooks:      &WebhooksResource{c: c},
		Capture:       &CaptureResource{c: c},
		Settings:      &SettingsResource{c: c},
	}
}
