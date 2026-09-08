# kernaq-go

Official Go client for the [Kernaq Identity API](https://kernaq.com).

Document OCR · Face matching · Liveness detection · Full KYC pipeline

**Requirements:** Go 1.21+

---

## Installation

```bash
go get github.com/Kernaq/sdk-go
```

---

## Quick start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/Kernaq/sdk-go/kernaq"
)

func main() {
    client := kernaq.New(kernaq.Config{
        APIKey: "k_live_your_key_here",
    })

    docFile, _ := os.Open("national_id.jpg")
    selfieFile, _ := os.Open("selfie.jpg")
    videoFile, _ := os.Open("liveness.mp4")
    defer docFile.Close()
    defer selfieFile.Close()
    defer videoFile.Close()

    result, err := client.Verify.Run(context.Background(), kernaq.VerifyInput{
        Document:     docFile,
        Selfie:       selfieFile,
        Video:        videoFile,
        DocumentType: kernaq.DocumentTypeNationalID,
        Country:      "KEN",
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("Verdict:", result.Verdict)
    fmt.Println("Name:", result.DocumentFields.Name)
}
```

---

## Authentication

Get your API key from the [Kernaq dashboard](https://kernaq.com/dashboard/api-keys).

```go
// Option 1 — pass directly in Config
client := kernaq.New(kernaq.Config{
    APIKey: "k_live_…",
})

// Option 2 — environment variable (recommended for production)
// Set KERNAQ_API_KEY=k_live_… in your environment
client := kernaq.New(kernaq.Config{})
```

---

## Full KYC pipeline

`POST /v1/verify` — runs document OCR, face match, and liveness in one call.
Returns the result synchronously. Nothing is stored on Kernaq servers.

### Live verification

```go
docFile, _    := os.Open("national_id.jpg")
selfieFile, _ := os.Open("selfie.jpg")
videoFile, _  := os.Open("liveness.mp4")
defer docFile.Close()
defer selfieFile.Close()
defer videoFile.Close()

result, err := client.Verify.Run(ctx, kernaq.VerifyInput{
    Document:     docFile,
    Selfie:       selfieFile,
    Video:        videoFile,
    DocumentType: kernaq.DocumentTypeNationalID,
    Country:      "KEN",
})
if err != nil {
    var kErr *kernaq.Error
    if errors.As(err, &kErr) {
        fmt.Println("API error:", kErr.Code, kErr.Message, kErr.StatusCode)
    }
    return
}

fmt.Println(result.Verdict)           // "pass" | "fail" | "review"
fmt.Println(result.Score)             // 0–100
fmt.Println(result.FaceMatch)         // true | false
fmt.Println(result.FaceConfidence)    // e.g. 98.7
fmt.Println(result.LivenessPass)      // true | false
fmt.Println(result.DocumentFields.Name)
fmt.Println(result.DocumentFields.DocumentNumber)
fmt.Println(result.DocumentFields.DateOfBirth)
fmt.Println(result.FailureReason)     // only set on "fail"
fmt.Println(result.DurationMs)        // e.g. 4823
```

### Sandbox verification (no billing)

```go
result, err := client.Verify.Sandbox(ctx, kernaq.VerifyInput{
    Document:     docFile,
    Selfie:       selfieFile,
    Video:        videoFile,
    DocumentType: kernaq.DocumentTypePassport,
    Country:      "GBR",
})
```

### Low-bandwidth mode (3 frames instead of video)

```go
f1, _ := os.Open("frame1.jpg")
f2, _ := os.Open("frame2.jpg")
f3, _ := os.Open("frame3.jpg")
defer f1.Close(); defer f2.Close(); defer f3.Close()

result, err := client.Verify.Run(ctx, kernaq.VerifyInput{
    Document:     docFile,
    Selfie:       selfieFile,
    Frame1:       f1,
    Frame2:       f2,
    Frame3:       f3,
    DocumentType: kernaq.DocumentTypeNationalID,
    Country:      "KEN",
})
```

---

## Document OCR

`POST /v1/documents/extract` — extracts structured fields from any supported ID.

```go
docFile, _ := os.Open("passport.jpg")
defer docFile.Close()

resp, err := client.Documents.Extract(ctx, kernaq.ExtractDocumentRequest{
    Document:     docFile,
    DocumentType: kernaq.DocumentTypePassport,
    Country:      "KEN",
})
if err != nil { log.Fatal(err) }

fmt.Println(resp.FirstName)       // "John"
fmt.Println(resp.LastName)        // "Kamau"
fmt.Println(resp.DocumentNumber)  // "AB123456"
fmt.Println(resp.DateOfBirth)     // "1990-05-14"
fmt.Println(resp.ExpiryDate)      // "2030-05-13"
```

### Document validation

`POST /v1/documents/validate` — checks document fields and expiry.

```go
resp, err := client.Documents.Validate(ctx, kernaq.ValidateDocumentRequest{
    Document:     docFile,
    DocumentType: kernaq.DocumentTypeNationalID,
    Country:      "KEN",
})

fmt.Println(resp.Valid)   // true | false
fmt.Println(resp.Reason)  // e.g. "expired"
```

---

## Face matching

`POST /v1/face/match` — compares two face images. Returns similarity score.

```go
idPhoto, _ := os.Open("id-photo.jpg")
selfie, _  := os.Open("selfie.jpg")
defer idPhoto.Close()
defer selfie.Close()

resp, err := client.Face.Match(ctx, kernaq.FaceMatchRequest{
    ImageA: idPhoto,
    ImageB: selfie,
})

fmt.Println(resp.Matched)     // true | false
fmt.Println(resp.Confidence)  // e.g. 98.7
```

### Face detection

`POST /v1/face/detect` — detects a face and returns bounding box + attributes.

```go
photo, _ := os.Open("photo.jpg")
defer photo.Close()

resp, err := client.Face.Detect(ctx, kernaq.FaceDetectRequest{
    Image: photo,
})

fmt.Println(resp.Detected)      // true
fmt.Println(resp.Confidence)    // 99.1
fmt.Printf("Box: %.2f, %.2f, %.2f, %.2f\n",
    resp.BoundingBox.Left,
    resp.BoundingBox.Top,
    resp.BoundingBox.Width,
    resp.BoundingBox.Height,
)
fmt.Printf("Age: %d–%d\n", resp.AgeRangeLow, resp.AgeRangeHigh)
```

---

## Liveness detection

`POST /v1/liveness/check` — checks a video or frame sequence for real human presence.

```go
// Standard — video
videoFile, _ := os.Open("liveness.mp4")
defer videoFile.Close()

resp, err := client.Liveness.Check(ctx, kernaq.LivenessCheckRequest{
    Video: videoFile,
})

// Low-bandwidth — 3 frames
f1, _ := os.Open("frame1.jpg")
f2, _ := os.Open("frame2.jpg")
f3, _ := os.Open("frame3.jpg")
defer f1.Close(); defer f2.Close(); defer f3.Close()

resp, err := client.Liveness.Check(ctx, kernaq.LivenessCheckRequest{
    Frame1: f1,
    Frame2: f2,
    Frame3: f3,
})

fmt.Println(resp.Passed)     // true | false
fmt.Println(resp.Confidence) // e.g. 96.2
```

---

## Document type constants

```go
const (
    kernaq.DocumentTypeNationalID           // "national_id"
    kernaq.DocumentTypePassport             // "passport"
    kernaq.DocumentTypeDriverLicense        // "driver_license"
    kernaq.DocumentTypeResidencePermit      // "residence_permit"
    kernaq.DocumentTypeAlienCard            // "alien_card"
    kernaq.DocumentTypeVoterID              // "voter_id"
    kernaq.DocumentTypeRefugeeID            // "refugee_id"
    kernaq.DocumentTypeStudentID            // "student_id"
    kernaq.DocumentTypeMilitaryID           // "military_id"
    kernaq.DocumentTypeKRAPinCertificate    // "kra_pin_certificate"
    kernaq.DocumentTypeSHACard              // "sha_card"
    kernaq.DocumentTypeUtilityBill          // "utility_bill"
    kernaq.DocumentTypeBankStatement        // "bank_statement"
    kernaq.DocumentTypeProofOfAddress       // "proof_of_address"
    kernaq.DocumentTypeOther                // "other"
)
```

---

## Error handling

All SDK methods return a typed `*kernaq.Error` on API failures:

```go
result, err := client.Verify.Run(ctx, input)
if err != nil {
    var kErr *kernaq.Error
    if errors.As(err, &kErr) {
        fmt.Println("Code:", kErr.Code)        // e.g. "VERIFICATION_FAILED"
        fmt.Println("Message:", kErr.Message)  // Human-readable
        fmt.Println("Status:", kErr.StatusCode) // 400, 401, 422, 500
    }
    return
}
```

Common error codes:

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `INVALID_FILE_FORMAT` | 422 | File is corrupt, wrong format, or zero bytes |
| `DOCUMENT_TOO_SMALL` | 422 | Image resolution too low |
| `UNSUPPORTED_DOCUMENT` | 422 | Document type not recognised |
| `VERIFICATION_FAILED` | 422 | Pipeline ran but verification failed |
| `INSUFFICIENT_BALANCE` | 402 | Live balance depleted |
| `INTERNAL_ERROR` | 500 | Server error — retry with backoff |

---

## Usage & logs

```go
// Aggregate stats
usage, err := client.Usage.Get(ctx, 30)
fmt.Println(usage.TotalCalls)    // 1420
fmt.Println(usage.SuccessCalls)  // 1380

// Per-call logs
logs, err := client.Usage.GetLogs(ctx, 50, 0)
for _, log := range logs.Logs {
    fmt.Println(log.Endpoint, log.StatusCode, log.DurationMs, log.CreatedAt)
}
```

---

## HTTP server example (net/http)

```go
package main

import (
    "encoding/json"
    "net/http"

    "github.com/Kernaq/sdk-go/kernaq"
)

var k = kernaq.New(kernaq.Config{})

func verifyHandler(w http.ResponseWriter, r *http.Request) {
    if err := r.ParseMultipartForm(32 << 20); err != nil {
        http.Error(w, "bad request", http.StatusBadRequest)
        return
    }

    doc, _, err := r.FormFile("document")
    if err != nil { http.Error(w, "missing document", 400); return }
    selfie, _, err := r.FormFile("selfie")
    if err != nil { http.Error(w, "missing selfie", 400); return }
    video, _, _ := r.FormFile("video") // optional
    defer doc.Close(); defer selfie.Close()

    result, err := k.Verify.Run(r.Context(), kernaq.VerifyInput{
        Document:     doc,
        Selfie:       selfie,
        Video:        video,
        DocumentType: r.FormValue("document_type"),
        Country:      r.FormValue("country"),
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnprocessableEntity)
        return
    }

    // Store result in your own database here
    // Kernaq does not store any data

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result)
}
```

---

## Configuration reference

```go
client := kernaq.New(kernaq.Config{
    APIKey:  "k_live_…",       // default: KERNAQ_API_KEY env var
    BaseURL: "https://api.identity.kernaq.com/v1",  // default
    Timeout: 120 * time.Second, // default
})
```

---

## License

See `LICENSE` in the repository root.
