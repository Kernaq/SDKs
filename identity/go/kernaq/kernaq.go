// Package kernaq provides the official Go client for the Kernaq Identity API.
// Process-and-forget model: submit → result in 3-8s → nothing stored.
// Requires Go 1.22+. Zero external dependencies.
//
// # Quick start
//
//	client := kernaq.New(kernaq.Config{}) // reads KERNAQ_API_KEY + KERNAQ_API_URL from env
//
//	// Full KYC pipeline — synchronous, result in 3–8s
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
//
//	// Sandbox (no billing)
//	result, err = client.Verify.Sandbox(ctx, input)
//
//	// Standalone OCR
//	fields, err := client.Documents.Extract(ctx, kernaq.ExtractDocumentRequest{
//	    Document: docFile, DocumentType: "passport", Country: "KEN",
//	})
//
//	// Face match
//	match, err := client.Face.Match(ctx, kernaq.FaceMatchRequest{
//	    ImageA: faceAFile, ImageB: faceBFile,
//	})
//
//	// Usage stats (non-PII)
//	stats, err := client.Usage.Get(ctx, 30)
package kernaq

// Client is the root entry point. Create once and reuse across goroutines.
type Client struct {
	// Verify handles the synchronous full KYC pipeline.
	Verify *VerifyResource
	// Documents provides standalone document OCR and validation.
	Documents *DocumentsResource
	// Face provides standalone face detection and matching.
	Face *FaceResource
	// Liveness provides standalone liveness detection.
	Liveness *LivenessResource
	// Usage provides non-PII call counts for billing and dashboards.
	Usage *UsageResource
}

// New creates a Kernaq Identity API client.
// Config fields fall back to KERNAQ_API_KEY and KERNAQ_API_URL env vars,
// so a zero-value Config works in a 12-factor app.
func New(cfg Config) *Client {
	c := newClient(cfg)
	return &Client{
		Verify:    &VerifyResource{c: c},
		Documents: &DocumentsResource{c: c},
		Face:      &FaceResource{c: c},
		Liveness:  &LivenessResource{c: c},
		Usage:     &UsageResource{c: c},
	}
}
