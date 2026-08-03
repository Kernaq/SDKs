package kernaq

import "context"

// FaceResource handles stateless face detection and matching endpoints.
type FaceResource struct {
	c *client
}

// Detect detects the primary face in an image and returns attributes. Nothing stored.
func (r *FaceResource) Detect(ctx context.Context, req FaceDetectRequest) (*FaceDetectResponse, error) {
	imgName := nameOr(req.ImageName, "image.jpg")
	files := []filePart{{field: "image", reader: req.Image, filename: imgName, mime: mimeFromName(imgName)}}
	var out FaceDetectResponse
	if err := r.c.upload(ctx, "/face/detect", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Match compares two face images. Returns matched + confidence. Nothing stored.
// ImageA is sent as "face_a", ImageB as "face_b".
func (r *FaceResource) Match(ctx context.Context, req FaceMatchRequest) (*FaceMatchResponse, error) {
	aName := nameOr(req.ImageAName, "face_a.jpg")
	bName := nameOr(req.ImageBName, "face_b.jpg")
	files := []filePart{
		{field: "face_a", reader: req.ImageA, filename: aName, mime: mimeFromName(aName)},
		{field: "face_b", reader: req.ImageB, filename: bName, mime: mimeFromName(bName)},
	}
	var out FaceMatchResponse
	if err := r.c.upload(ctx, "/face/match", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
