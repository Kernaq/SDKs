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
//
// Liveness: supply Video OR all three Frame fields (low-bandwidth alternative).
func (r *VerificationsResource) Submit(ctx context.Context, req SubmitVerificationRequest) (*SubmitVerificationResponse, error) {
	fields := map[string]string{
		"document_type": string(req.DocumentType),
		"country":       req.Country,
		"reference":     req.Reference,
	}
	if req.ExternalUserID   != "" { fields["external_user_id"]  = req.ExternalUserID }
	if req.ConsentReference != "" { fields["consent_reference"] = req.ConsentReference }
	if req.ConsentAt        != "" { fields["consent_at"]        = req.ConsentAt }
	if req.ConsentType      != "" { fields["consent_type"]      = req.ConsentType }

	docName  := nameOr(req.DocumentName, "document.jpg")
	selfName := nameOr(req.SelfieName,   "selfie.jpg")

	files := []filePart{
		{field: "document", reader: req.Document, filename: docName,  mime: mimeFromName(docName)},
		{field: "selfie",   reader: req.Selfie,   filename: selfName, mime: mimeFromName(selfName)},
	}

	if req.Video != nil {
		vidName := nameOr(req.VideoName, "liveness.mp4")
		files = append(files, filePart{
			field: "video", reader: req.Video, filename: vidName, mime: mimeFromName(vidName),
		})
	} else if req.Frame1 != nil && req.Frame2 != nil && req.Frame3 != nil {
		f1 := nameOr(req.Frame1Name, "frame_1.jpg")
		f2 := nameOr(req.Frame2Name, "frame_2.jpg")
		f3 := nameOr(req.Frame3Name, "frame_3.jpg")
		files = append(files,
			filePart{field: "frame_1", reader: req.Frame1, filename: f1, mime: "image/jpeg"},
			filePart{field: "frame_2", reader: req.Frame2, filename: f2, mime: "image/jpeg"},
			filePart{field: "frame_3", reader: req.Frame3, filename: f3, mime: "image/jpeg"},
		)
	}

	extra := map[string]string{}
	if req.CaptureToken != "" { extra["X-Capture-Token"] = req.CaptureToken }
	if req.CaptureNonce != "" { extra["X-Capture-Nonce"] = req.CaptureNonce }

	var out SubmitVerificationResponse
	if err := r.c.uploadWithHeaders(ctx, "/verifications", fields, files, extra, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SubmitAndWait submits a verification and polls until terminal (verified | failed | review).
//
// Example:
//
//	result, err := client.Verifications.SubmitAndWait(ctx, SubmitVerificationRequest{
//	    Document:     docFile,
//	    Selfie:       selfieFile,
//	    Video:        videoFile,
//	    DocumentType: DocumentTypePassport,
//	    Country:      "KEN",
//	    Reference:    "user_acct_123",
//	}, nil)
//	if result.Status == VerificationStatusFailed {
//	    fmt.Println(result.FailureReason) // e.g. "face_mismatch"
//	}
func (r *VerificationsResource) SubmitAndWait(ctx context.Context, req SubmitVerificationRequest, opts *PollOptions) (*VerificationResult, error) {
	interval := 2 * time.Second
	timeout  := 3 * time.Minute
	var onStatus func(VerificationStatus)

	if opts != nil {
		if opts.Interval > 0 { interval = opts.Interval }
		if opts.Timeout  > 0 { timeout  = opts.Timeout }
		onStatus = opts.OnStatus
	}

	submitted, err := r.Submit(ctx, req)
	if err != nil {
		return nil, err
	}

	id       := submitted.VerificationID
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

// Get returns the full verification result, including FailureReason when failed.
func (r *VerificationsResource) Get(ctx context.Context, id string) (*VerificationResult, error) {
	var out VerificationResult
	if err := r.c.get(ctx, "/verifications/"+id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetStatus returns the lightweight status poll result,
// including FailureReason when status is failed.
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
// Use opts.Status to filter; leave empty to return all statuses.
func (r *VerificationsResource) List(ctx context.Context, opts *ListVerificationsOptions) (*ListVerificationsResponse, error) {
	path := "/verifications"
	if opts != nil {
		params := ""
		if opts.Limit  > 0  { params += fmt.Sprintf("limit=%d&", opts.Limit) }
		if opts.Before != "" { params += fmt.Sprintf("before=%s&", opts.Before) }
		if opts.Status != "" { params += fmt.Sprintf("status=%s&", string(opts.Status)) }
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
