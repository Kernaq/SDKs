package kernaq

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	defaultBaseURL = "https://api.kernaq.com/v1"
	defaultTimeout = 120 * time.Second
)

// FileInput can be any readable source — an os.File, bytes.Reader, etc.
type FileInput = io.Reader

// client is the underlying HTTP transport.
type client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

func newClient(cfg Config) *client {
	apiKey := cfg.APIKey
	if apiKey == "" {
		apiKey = os.Getenv("KERNAQ_API_KEY")
	}

	baseURL := cfg.BaseURL
	if baseURL == "" {
		baseURL = os.Getenv("KERNAQ_API_URL")
	}
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	baseURL = strings.TrimRight(baseURL, "/")

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = defaultTimeout
	}

	return &client{
		apiKey:  apiKey,
		baseURL: baseURL,
		http:    &http.Client{Timeout: timeout},
	}
}

// ── JSON request ──────────────────────────────────────────────────────────────

func (c *client) do(ctx context.Context, method, path string, body io.Reader, contentType string, out interface{}) error {
	url := c.baseURL + path

	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return fmt.Errorf("kernaq: build request: %w", err)
	}

	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("Accept", "application/json")
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("kernaq: request failed: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("kernaq: read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr Error
		if jsonErr := json.Unmarshal(raw, &apiErr); jsonErr != nil {
			apiErr = Error{Code: "UNKNOWN_ERROR", Message: string(raw)}
		}
		apiErr.StatusCode = resp.StatusCode
		return &apiErr
	}

	if out != nil {
		if err := json.Unmarshal(raw, out); err != nil {
			return fmt.Errorf("kernaq: decode response: %w", err)
		}
	}
	return nil
}

func (c *client) get(ctx context.Context, path string, out interface{}) error {
	return c.do(ctx, http.MethodGet, path, nil, "", out)
}

// ── Multipart upload ──────────────────────────────────────────────────────────

type filePart struct {
	field    string
	reader   io.Reader
	filename string
	mime     string
}

func (c *client) upload(ctx context.Context, path string, fields map[string]string, files []filePart, out interface{}) error {
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	// Text fields
	for key, val := range fields {
		if err := mw.WriteField(key, val); err != nil {
			return fmt.Errorf("kernaq: write field %q: %w", key, err)
		}
	}

	// File parts
	for _, f := range files {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", fmt.Sprintf(`form-data; name=%q; filename=%q`, f.field, f.filename))
		h.Set("Content-Type", f.mime)

		part, err := mw.CreatePart(h)
		if err != nil {
			return fmt.Errorf("kernaq: create part %q: %w", f.field, err)
		}
		if _, err := io.Copy(part, f.reader); err != nil {
			return fmt.Errorf("kernaq: copy part %q: %w", f.field, err)
		}
	}

	if err := mw.Close(); err != nil {
		return fmt.Errorf("kernaq: close multipart: %w", err)
	}

	return c.do(ctx, http.MethodPost, path, &buf, mw.FormDataContentType(), out)
}

// ── MIME helpers ──────────────────────────────────────────────────────────────

func mimeFromName(name string) string {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(name), "."))
	switch ext {
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "heic":
		return "image/heic"
	case "pdf":
		return "application/pdf"
	case "mp4":
		return "video/mp4"
	case "mov":
		return "video/quicktime"
	case "webm":
		return "video/webm"
	default:
		return "application/octet-stream"
	}
}

func nameOr(s, fallback string) string {
	if s != "" {
		return s
	}
	return fallback
}
