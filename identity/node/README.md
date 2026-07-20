# @kernaq/identity

Official Node.js / TypeScript SDK for the Kernaq Identity API.

## Installation

```bash
npm install @kernaq/identity
```

## Quick start

```ts
import { Kernaq } from '@kernaq/identity'
import * as fs from 'fs'

const kernaq = new Kernaq({ apiKey: process.env.KERNAQ_API_KEY! })

// Full KYC pipeline — submits and polls automatically
const result = await kernaq.verifications.submitAndWait({
  document:     fs.createReadStream('passport.jpg'),
  selfie:       fs.createReadStream('selfie.jpg'),
  video:        fs.createReadStream('liveness.mp4'),
  documentType: 'passport',
  country:      'KEN',
  reference:    'user_acct_123',
})

console.log(result.status)                     // 'verified'
console.log(result.face?.matched)              // true
console.log(result.face?.confidence)           // 99.2
console.log(result.document?.extracted_data)   // { first_name, last_name, ... }
console.log(result.risk?.level)                // 'low'
```

## API reference

### `kernaq.verifications`

| Method | Description |
|---|---|
| `submit(req)` | Submit a KYC verification. Returns 202 immediately. |
| `submitAndWait(req, opts?)` | Submit and poll until complete. Returns the full result. |
| `get(id)` | Get the full result for a verification. |
| `getStatus(id)` | Poll the lightweight status endpoint. |
| `getReport(id)` | Get the full verification report (after pipeline completes). |
| `list(opts?)` | List verifications for the project. |

### `kernaq.documents`

| Method | Description |
|---|---|
| `extract(req)` | Extract structured fields from a document image (OCR). |
| `validate(req)` | Validate a document and return validity flags. |

### `kernaq.face`

| Method | Description |
|---|---|
| `detect(req)` | Detect a face and return bounding box + attributes. |
| `match(req)` | Compare two face images and return a similarity score. |

### `kernaq.liveness`

| Method | Description |
|---|---|
| `check(req)` | Check a video for liveness — detects replay and spoof. |

## Error handling

All methods throw `KernaqError` on non-2xx responses.

```ts
import { KernaqError } from '@kernaq/identity'

try {
  const result = await kernaq.verifications.submitAndWait({ ... })
} catch (err) {
  if (err instanceof KernaqError) {
    console.log(err.statusCode) // 401
    console.log(err.code)       // 'UNAUTHORIZED'
    console.log(err.message)    // 'invalid API key'
  }
}
```

## Poll options

```ts
const result = await kernaq.verifications.submitAndWait(req, {
  intervalMs: 3000,     // poll every 3s (default: 2000)
  timeoutMs:  120_000,  // give up after 2min (default: 180_000)
  onStatus: (status) => console.log('status:', status),
})
```

## Key formats

- `k_test_…` — sandbox, no billing events
- `k_live_…` — production, real data, generates billing events

Get keys from the [Kernaq dashboard](https://kernaq.com/dashboard).
