// Package kernaq provides the official Go client for the Kernaq Identity API.
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
package kernaq

// Client is the root entry point. Create once and reuse.
type Client struct {
	Verifications *VerificationsResource
	Documents     *DocumentsResource
	Face          *FaceResource
	Liveness      *LivenessResource
}

// New creates a Kernaq Identity API client.
// Config fields fall back to KERNAQ_API_KEY and KERNAQ_API_URL environment
// variables when empty, so zero-value Config works in a 12-factor app.
func New(cfg Config) *Client {
	c := newClient(cfg)
	return &Client{
		Verifications: &VerificationsResource{c: c},
		Documents:     &DocumentsResource{c: c},
		Face:          &FaceResource{c: c},
		Liveness:      &LivenessResource{c: c},
	}
}
