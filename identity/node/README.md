# @kernaq/identity

Official Node.js / TypeScript SDK for the **Kernaq Identity API**.

**Process-and-forget model:** submit → result in 3–8 seconds → nothing stored.

## Installation

```bash
npm install @kernaq/identity
```

Requires Node.js 18+.

## Quick start

```typescript
import { Kernaq } from '@kernaq/identity'
import * as fs from 'fs'

const kernaq = new Kernaq({ apiKey: process.env.KERNAQ_API_KEY! })

// Full KYC pipeline — synchronous, result in 3–8 seconds
const result = await kernaq.verify.run({
  document:     fs.createReadStream('id.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),
  documentType: 'national_id',
  country:      'KEN',
})

if (result.verdict === 'pass') {
  console.log(result.documentFields.name)       // "JOHN OLE DOE"
  console.log(result.documentFields.dateOfBirth) // "1990-05-15"
  console.log(result.faceMatch)                  // true
  console.log(result.score)                      // 8 (0–100, lower = safer)
}

// Sandbox mode (no billing, same pipeline)
const sandbox = await kernaq.verify.sandbox({
  document:     fs.createReadStream('id.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),
  documentType: 'national_id',
  country:      'KEN',
})
```

## Standalone endpoints

```typescript
// OCR only — extract fields from a document
const fields = await kernaq.documents.extract({
  document:     fs.createReadStream('id.jpg'),
  documentType: 'national_id',
})
console.log(fields.documentNumber, fields.dateOfBirth)

// Validate a document
const validation = await kernaq.documents.validate({
  document: fs.createReadStream('id.jpg'),
})
console.log(validation.valid)

// Face match — compare two images
const match = await kernaq.face.match({
  faceA:     fs.createReadStream('document.jpg'),
  faceB:     fs.createReadStream('selfie.jpg'),
})
console.log(match.matched, match.confidence) // true, 0.97

// Face detect — detect primary face in image
const detection = await kernaq.face.detect({
  image: fs.createReadStream('photo.jpg'),
})
console.log(detection.detected, detection.ageRangeLow, detection.ageRangeHigh)

// Liveness — video
const liveness = await kernaq.liveness.check({
  video: fs.createReadStream('liveness.mp4'),
})
console.log(liveness.passed)

// Liveness — 3-frame low-bandwidth alternative
const liveness2 = await kernaq.liveness.check({
  frame1: fs.createReadStream('frame_front.jpg'),
  frame2: fs.createReadStream('frame_left.jpg'),
  frame3: fs.createReadStream('frame_right.jpg'),
})

// Usage stats (non-PII call counts)
const usage = await kernaq.usage.get({ days: 30 })
console.log(usage.totalCalls, usage.successRate)
```

## Verdict values

| Verdict | Score | Meaning |
|---------|-------|---------|
| `pass` | 0–20 | All checks passed |
| `review` | 21–60 | Manual review recommended |
| `fail` | 61+ | One or more hard checks failed |

## Failure reasons

When `verdict === 'fail'`, check `result.failureReason`:

- `face_mismatch` — selfie doesn't match document photo → ask user to retake selfie
- `liveness_failed` — liveness check failed → retry with better lighting
- `document_invalid` — OCR failed to extract required fields → ask for clearer photo
- `high_risk` — risk score exceeded threshold → flag for manual review
- `pipeline_error` — internal error → safe to retry once

## API keys

| Prefix | Mode | Billing |
|--------|------|---------|
| `k_test_` | Sandbox | No billing, same pipeline |
| `k_live_` | Production | Deducts credits |

Set via `KERNAQ_API_KEY` environment variable or pass to constructor.

## Configuration

```typescript
const kernaq = new Kernaq({
  apiKey:    'k_test_...',
  baseUrl:   'https://api.kernaq.com/v1', // optional override
  timeoutMs: 120_000,                      // default: 120s
})
```

## What Kernaq does NOT store

Nothing with personal data. The only DB write per call is a non-PII log:
`{ partner_id, endpoint, status_code, duration_ms }` — no names, IDs, photos, or scores.
