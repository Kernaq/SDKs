package kernaq

import "context"

// DocumentsResource handles stateless document OCR endpoints.
type DocumentsResource struct {
	c *client
}

// Extract extracts structured fields from an ID document. Nothing stored.
func (r *DocumentsResource) Extract(ctx context.Context, req ExtractDocumentRequest) (*ExtractDocumentResponse, error) {
	fields := map[string]string{}
	if req.DocumentType != "" {
		fields["document_type"] = req.DocumentType
	}
	if req.Country != "" {
		fields["country"] = req.Country
	}
	docName := nameOr(req.DocumentName, "document.jpg")
	files := []filePart{{field: "document", reader: req.Document, filename: docName, mime: mimeFromName(docName)}}
	var out ExtractDocumentResponse
	if err := r.c.upload(ctx, "/documents/extract", fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Validate validates document fields (expiry, required fields present). Nothing stored.
func (r *DocumentsResource) Validate(ctx context.Context, req ValidateDocumentRequest) (*ValidateDocumentResponse, error) {
	fields := map[string]string{}
	if req.DocumentType != "" {
		fields["document_type"] = req.DocumentType
	}
	if req.Country != "" {
		fields["country"] = req.Country
	}
	docName := nameOr(req.DocumentName, "document.jpg")
	files := []filePart{{field: "document", reader: req.Document, filename: docName, mime: mimeFromName(docName)}}
	var out ValidateDocumentResponse
	if err := r.c.upload(ctx, "/documents/validate", fields, files, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
