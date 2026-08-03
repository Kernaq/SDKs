package kernaq

import (
	"context"
	"fmt"
)

// LivenessResource handles stateless liveness detection.
type LivenessResource struct {
	c *client
}

// Check checks for a live real person. Supply Video OR all three Frame fields.
// Nothing stored.
func (r *LivenessResource) Check(ctx context.Context, req LivenessCheckRequest) (*LivenessCheckResponse, error) {
	var files []filePart
	if req.Video != nil {
		vidName := nameOr(req.VideoName, "liveness.mp4")
		files = []filePart{{field: "video", reader: req.Video, filename: vidName, mime: mimeFromName(vidName)}}
	} else if req.Frame1 != nil && req.Frame2 != nil && req.Frame3 != nil {
		f1 := nameOr(req.Frame1Name, "frame1.jpg")
		f2 := nameOr(req.Frame2Name, "frame2.jpg")
		f3 := nameOr(req.Frame3Name, "frame3.jpg")
		files = []filePart{
			{field: "frame1", reader: req.Frame1, filename: f1, mime: "image/jpeg"},
			{field: "frame2", reader: req.Frame2, filename: f2, mime: "image/jpeg"},
			{field: "frame3", reader: req.Frame3, filename: f3, mime: "image/jpeg"},
		}
	} else {
		return nil, fmt.Errorf("supply either Video or all three Frame fields (Frame1, Frame2, Frame3)")
	}
	var out LivenessCheckResponse
	if err := r.c.upload(ctx, "/liveness/check", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
