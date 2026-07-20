package kernaq

import "context"

// LivenessResource handles /v1/liveness.
type LivenessResource struct {
	c *client
}

// Check analyses a liveness video for replay attacks and spoof attempts.
func (r *LivenessResource) Check(ctx context.Context, req LivenessCheckRequest) (*LivenessCheckResponse, error) {
	name := nameOr(req.VideoName, "liveness.mp4")
	files := []filePart{
		{field: "video", reader: req.Video, filename: name, mime: mimeFromName(name)},
	}

	var out LivenessCheckResponse
	if err := r.c.upload(ctx, "/liveness/check", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
