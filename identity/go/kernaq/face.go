package kernaq

import "context"

// FaceResource handles /v1/face.
type FaceResource struct {
	c *client
}

// Detect detects a face in an image and returns bounding box + attributes.
func (r *FaceResource) Detect(ctx context.Context, req FaceDetectRequest) (*FaceDetectResponse, error) {
	name := nameOr(req.ImageName, "image.jpg")
	files := []filePart{
		{field: "image", reader: req.Image, filename: name, mime: mimeFromName(name)},
	}

	var out FaceDetectResponse
	if err := r.c.upload(ctx, "/face/detect", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Match compares two face images and returns a similarity score.
func (r *FaceResource) Match(ctx context.Context, req FaceMatchRequest) (*FaceMatchResponse, error) {
	nameA := nameOr(req.ImageAName, "image_a.jpg")
	nameB := nameOr(req.ImageBName, "image_b.jpg")
	files := []filePart{
		{field: "image_a", reader: req.ImageA, filename: nameA, mime: mimeFromName(nameA)},
		{field: "image_b", reader: req.ImageB, filename: nameB, mime: mimeFromName(nameB)},
	}

	var out FaceMatchResponse
	if err := r.c.upload(ctx, "/face/match", nil, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
