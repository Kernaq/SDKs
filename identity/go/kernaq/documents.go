package kernaq

import "context"

// DocumentsResource handles /v1/documents.
type DocumentsResource struct {
	c *client
}

// Extract runs OCR on a document image and returns structured identity fields.
func (r *DocumentsResource) Extract(ctx context.Context, req ExtractDocumentRequest) (*ExtractDocumentResponse, error) {
	fields := map[string]string{}
	if req.DocumentType != "" {
		fields["document_type"] = string(req.DocumentType)
	}
	if req.Country != "" {
		fields["country"] = req.Country
	}

	name := nameOr(req.DocumentName, "document.jpg")
	files := []filePart{
		{field: "document", reader: req.Document, filename: name, mime: mimeFromName(name)},
	}

	var out ExtractDocumentResponse
	if err := r.c.upload(ctx, "/documents/extract", fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Validate checks document validity and returns flags without full OCR.
func (r *DocumentsResource) Validate(ctx context.Context, req ValidateDocumentRequest) (*ValidateDocumentResponse, error) {
	fields := map[string]string{}
	if req.DocumentType != "" {
		fields["document_type"] = string(req.DocumentType)
	}
	if req.Country != "" {
		fields["country"] = req.Country
	}

	name := nameOr(req.DocumentName, "document.jpg")
	files := []filePart{
		{field: "document", reader: req.Document, filename: name, mime: mimeFromName(name)},
	}

	var out ValidateDocumentResponse
	if err := r.c.upload(ctx, "/documents/validate", fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
