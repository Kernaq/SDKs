package kernaq

import "context"

// CaptureResource handles /v1/capture/sessions.
type CaptureResource struct {
	c *client
}

// CreateSession issues a short-lived capture session token (15 min, single-use).
//
// Call this from your backend, then pass the token + nonce to your frontend /
// headless capture SDK. Never call this from client-side code — it requires
// your API key.
//
// The frontend attaches both as X-Capture-Token and X-Capture-Nonce headers
// on the POST /verifications request.
func (r *CaptureResource) CreateSession(ctx context.Context, req CreateCaptureSessionRequest) (*CaptureSessionResponse, error) {
	var out CaptureSessionResponse
	if err := r.c.postJSON(ctx, "/capture/sessions", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
