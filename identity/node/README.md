# @kernaq/identity

Official Node.js / TypeScript SDK for the [Kernaq Identity API](https://kernaq.com).

Document OCR · Face matching · Liveness detection · Full KYC pipeline

**Requirements:** Node.js 18+ · No external dependencies

---

## Installation

```bash
npm install @kernaq/identity
```

---

## Quick start

```typescript
import Kernaq from '@kernaq/identity'
import fs from 'node:fs'

const kernaq = new Kernaq({ apiKey: 'k_live_your_key_here' })

const result = await kernaq.verify.run({
  document:     fs.createReadStream('id.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),
  documentType: 'national_id',
  country:      'KEN',
})

if (result.verdict === 'pass') {
  console.log('Verified:', result.documentFields.name)
} else {
  console.log('Failed:', result.failureReason)
}
```

---

## Authentication

Get your API key from the [Kernaq dashboard](https://kernaq.com/dashboard/api-keys).

- Use `k_test_…` keys for sandbox (no billing, same pipeline)
- Use `k_live_…` keys for production

```typescript
// Option 1 — pass directly
const kernaq = new Kernaq({ apiKey: 'k_live_…' })

// Option 2 — environment variable (recommended for production)
// Set KERNAQ_API_KEY=k_live_… in your environment
const kernaq = new Kernaq()
```

---

## Full KYC pipeline

`POST /v1/verify` — runs document OCR, face match, and liveness check in one call.
Returns the result synchronously. Nothing is stored on Kernaq servers.

### Live verification

```typescript
import fs from 'node:fs'

const result = await kernaq.verify.run({
  document:     fs.createReadStream('national_id.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),   // 3–8 second video
  documentType: 'national_id',
  country:      'KEN',
})

console.log(result.verdict)          // "pass" | "fail" | "review"
console.log(result.score)            // 0–100 confidence score
console.log(result.faceMatch)        // true | false
console.log(result.faceConfidence)   // 0–100
console.log(result.livenessPass)     // true | false
console.log(result.documentFields)   // { name, dateOfBirth, documentNumber, ... }
console.log(result.fraudFlags)       // e.g. ["document_expired"]
console.log(result.failureReason)    // e.g. "face_mismatch" (only on fail)
console.log(result.durationMs)       // e.g. 4823
```

### Sandbox verification (no billing)

```typescript
const result = await kernaq.verify.sandbox({
  document:     fs.createReadStream('passport.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),
  documentType: 'passport',
  country:      'GBR',
})
```

### Low-bandwidth mode (3 frames instead of video)

For devices with poor network connectivity, submit 3 JPEG frames instead of a video:

```typescript
const result = await kernaq.verify.run({
  document:     fs.createReadStream('id.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  frame1:       fs.createReadStream('frame1.jpg'),
  frame2:       fs.createReadStream('frame2.jpg'),
  frame3:       fs.createReadStream('frame3.jpg'),
  documentType: 'national_id',
  country:      'KEN',
})
```

### File input types

All file fields accept `Buffer`, `ReadableStream`, `Blob`, or `ArrayBuffer`:

```typescript
import { readFileSync } from 'node:fs'

// Buffer
const result = await kernaq.verify.run({
  document:     readFileSync('id.jpg'),
  selfie:       readFileSync('selfie.jpg'),
  video:        readFileSync('liveness.mp4'),
  documentType: 'national_id',
  country:      'KEN',
})
```

---

## Document OCR

`POST /v1/documents/extract` — extracts structured fields from any supported ID.

```typescript
const data = await kernaq.documents.extract({
  document:     fs.createReadStream('passport.jpg'),
  documentType: 'passport',
  country:      'KEN',
})

console.log(data.fields.name)            // "John Kamau"
console.log(data.fields.documentNumber)  // "AB123456"
console.log(data.fields.dateOfBirth)     // "1990-05-14"
console.log(data.fields.expiryDate)      // "2030-05-13"
console.log(data.fields.country)         // "KEN"
```

### Document validation

`POST /v1/documents/validate` — checks document fields, expiry, and completeness.

```typescript
const result = await kernaq.documents.validate({
  document:     fs.createReadStream('id.jpg'),
  documentType: 'national_id',
  country:      'KEN',
})

console.log(result.valid)   // true | false
console.log(result.flags)   // e.g. ["expired", "mrz_checksum_failed"]
```

---

## Face matching

`POST /v1/face/match` — compares two face images and returns a similarity score.

```typescript
const result = await kernaq.face.match({
  faceA: fs.createReadStream('id-photo.jpg'),
  faceB: fs.createReadStream('selfie.jpg'),
})

console.log(result.matched)     // true | false
console.log(result.confidence)  // e.g. 98.7
```

### Face detection

`POST /v1/face/detect` — detects a face in an image and returns bounding box + attributes.

```typescript
const result = await kernaq.face.detect({
  image: fs.createReadStream('photo.jpg'),
})

console.log(result.detected)      // true
console.log(result.confidence)    // 99.1
console.log(result.boundingBox)   // { left, top, width, height }
console.log(result.ageRangeLow)   // 25
console.log(result.ageRangeHigh)  // 35
```

---

## Liveness detection

`POST /v1/liveness/check` — checks a video or frame sequence for real human presence.
Blocks replay attacks and printed photo spoofs.

```typescript
// Standard — video
const result = await kernaq.liveness.check({
  video: fs.createReadStream('liveness.mp4'),
})

// Low-bandwidth — 3 frames
const result = await kernaq.liveness.check({
  frame1: fs.createReadStream('frame1.jpg'),
  frame2: fs.createReadStream('frame2.jpg'),
  frame3: fs.createReadStream('frame3.jpg'),
})

console.log(result.passed)     // true | false
console.log(result.confidence) // e.g. 96.2
```

---

## Supported document types

```typescript
type DocumentType =
  | 'national_id'         | 'passport'           | 'driver_license'
  | 'residence_permit'    | 'alien_card'          | 'voter_id'
  | 'refugee_id'          | 'student_id'          | 'military_id'
  | 'kra_pin_certificate' | 'sha_card'            | 'foreign_national_id'
  | 'utility_bill'        | 'bank_statement'      | 'proof_of_address'
  | 'tax_document'        | 'employment_letter'   | 'vehicle_registration'
  | 'tenancy_agreement'   | 'business_registration' | 'other'
```

---

## Error handling

```typescript
import Kernaq, { KernaqError } from '@kernaq/identity'

try {
  const result = await kernaq.verify.run({ ... })
} catch (err) {
  if (err instanceof KernaqError) {
    console.log(err.code)        // e.g. "INVALID_FILE_FORMAT"
    console.log(err.message)     // Human-readable message
    console.log(err.statusCode)  // HTTP status code: 400, 401, 422, 500
  }
}
```

Common error codes:

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `INVALID_FILE_FORMAT` | 422 | File is corrupt, wrong format, or zero bytes |
| `DOCUMENT_TOO_SMALL` | 422 | Image resolution too low |
| `UNSUPPORTED_DOCUMENT` | 422 | Document type not recognised |
| `VERIFICATION_FAILED` | 422 | Pipeline ran but verification failed — check `failureReason` |
| `INSUFFICIENT_BALANCE` | 402 | Live balance depleted — fund your account |
| `INTERNAL_ERROR` | 500 | Server error — retry with exponential backoff |

---

## Usage & logs

```typescript
// Aggregate stats (last 30 days)
const usage = await kernaq.usage.get(30)
console.log(usage.totalCalls)    // 1420
console.log(usage.successCalls)  // 1380

// Per-call logs (paginated)
const logs = await kernaq.usage.getLogs(50, 0)
logs.logs.forEach(log => {
  console.log(log.endpoint, log.statusCode, log.durationMs, log.createdAt)
})
```

---

## Configuration reference

```typescript
const kernaq = new Kernaq({
  apiKey:    'k_live_…',   // default: process.env.KERNAQ_API_KEY
  baseUrl:   'https://api.identity.kernaq.com/v1',  // default
  timeoutMs: 120_000,      // default: 120 seconds
})
```

---

## Express.js example

```typescript
import express from 'express'
import multer from 'multer'
import Kernaq from '@kernaq/identity'

const app    = express()
const upload = multer({ storage: multer.memoryStorage() })
const kernaq = new Kernaq()

app.post(
  '/api/verify',
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie',   maxCount: 1 },
    { name: 'video',    maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>

    try {
      const result = await kernaq.verify.run({
        document:     files.document[0].buffer,
        selfie:       files.selfie[0].buffer,
        video:        files.video?.[0]?.buffer,
        documentType: req.body.documentType,
        country:      req.body.country,
      })

      // Store result in your own database here
      // Kernaq does not store any data

      res.json(result)
    } catch (err) {
      res.status(422).json({ error: (err as Error).message })
    }
  },
)
```

---

## License

See `LICENSE` in the repository root.
