package kernaq

import (
	"context"
	"fmt"
	"time"
)

// VerificationsResource handles /v1/verifications.
type VerificationsResource struct {
	c *client
}

var terminalStatuses = map[VerificationStatus]bool{
	VerificationStatusVerified: true,
	VerificationStatusFailed:   true,
	VerificationStatusReview:   true,
}

// Submit posts a full KYC verification and returns immediately (HTTP 202).
// Use SubmitAndWait to automatically poll until the pipeline completes.
func (r *VerificationsResource) Submit(ctx context.Context, req SubmitVerificationRequest) (*SubmitVerificationResponse, error) {
	fields := map[string]string{
		"document_type": string(req.DocumentType),
		"country":       req.Country,
		"reference":     req.Reference,
	}
	if req.ExternalUserID != "" {
		fields["external_user_id"] = req.ExternalUserID
	}

	docName := nameOr(req.DocumentName, "document.jpg")
	selfName := nameOr(req.SelfieName, "selfie.jpg")
	vidName := nameOr(req.VideoName, "liveness.mp4")

	files := []filePart{
		{field: "document", reader: req.Document, filename: docName,  mime: mimeFromName(docName)},
		{field: "selfie",   reader: req.Selfie,   filename: selfName, mime: mimeFromName(selfName)},
		{field: "video",    reader: req.Video,    filename: vidName,  mime: mimeFromName(vidName)},
	}

	var out SubmitVerificationResponse
	if err := r.c.upload(ctx, "/verifications", fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SubmitAndWait submits a verification and polls until it reaches a terminal
// state (verified | failed | review). Returns the full result.
//
// Example:
//
//	result, err := client.Verifications.SubmitAndWait(ctx,
//	    SubmitVerificationRequest{
//	        Document:     docFile,
//	        Selfie:       selfieFile,
//	        Video:        videoFile,
//	        DocumentType: DocumentTypePassport,
//	        Country:      "KEN",
//	        Reference:    "user_acct_123",
//	    }, nil)
func (r *VerificationsResource) SubmitAndWait(ctx context.Context, req SubmitVerificationRequest, opts *PollOptions) (*VerificationResult, error) {
	interval := 2 * time.Second
	timeout  := 3 * time.Minute
	var onStatus func(VerificationStatus)

	if opts != nil {
		if opts.Interval > 0 {
			interval = opts.Interval
		}
		if opts.Timeout > 0 {
			timeout = opts.Timeout
		}
		onStatus = opts.OnStatus
	}

	submitted, err := r.Submit(ctx, req)
	if err != nil {
		return nil, err
	}

	id := submitted.VerificationID
	deadline := time.Now().Add(timeout)

	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(interval):
		}

		statusRes, err := r.GetStatus(ctx, id)
		if err != nil {
			return nil, err
		}

		if onStatus != nil {
			onStatus(statusRes.Status)
		}

		if terminalStatuses[statusRes.Status] {
			return r.Get(ctx, id)
		}
	}

	return nil, fmt.Errorf("kernaq: verification %s did not complete within %s", id, timeout)
}

// Get returns the full verification result.
func (r *VerificationsResource) Get(ctx context.Context, id string) (*VerificationResult, error) {
	var out VerificationResult
	if err := r.c.get(ctx, "/verifications/"+id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetStatus returns the lightweight status of a verification.
func (r *VerificationsResource) GetStatus(ctx context.Context, id string) (*VerificationStatusResponse, error) {
	var out VerificationStatusResponse
	if err := r.c.get(ctx, "/verifications/"+id+"/status", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetReport returns the full verification report once the pipeline has completed.
func (r *VerificationsResource) GetReport(ctx context.Context, id string) (map[string]interface{}, error) {
	var out map[string]interface{}
	if err := r.c.get(ctx, "/verifications/"+id+"/report", &out); err != nil {
		return nil, err
	}
	return out, nil
}

// List returns verifications for the authenticated project.
func (r *VerificationsResource) List(ctx context.Context, opts *ListVerificationsOptions) (*ListVerificationsResponse, error) {
	path := "/verifications"
	if opts != nil {
		params := ""
		if opts.Limit > 0 {
			params += fmt.Sprintf("limit=%d&", opts.Limit)
		}
		if opts.Before != "" {
			params += fmt.Sprintf("before=%s&", opts.Before)
		}
		if params != "" {
			path += "?" + params[:len(params)-1]
		}
	}

	var out ListVerificationsResponse
	if err := r.c.get(ctx, path, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
