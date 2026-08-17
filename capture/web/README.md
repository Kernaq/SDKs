# @kernaq/capture-web

Browser-side capture SDK for the [Kernaq Identity API](https://kernaq.com).

Camera access · Pre-flight quality checks · Headless — you build the UI

**Requirements:** Modern browser with `getUserMedia` support · No external dependencies

---

## Why use this SDK?

When developers build their own camera UI they often send blurry, dark, or poorly framed images that cause OCR and face match to fail — then blame the API. This SDK enforces quality at the device before anything is uploaded:

- **Blur check** — Laplacian variance score. Rejects soft or out-of-focus images.
- **Brightness check** — rejects images that are too dark or washed out.
- **Fill ratio check** — rejects images where the subject is too small in the frame.

All checks run entirely in the browser using `OffscreenCanvas` — no server round-trip, no extra latency.

---

## Architecture

```
Browser (your UI)
  └── @kernaq/capture-web
        ├── CameraCapture — opens camera, captures photo/video, quality-checks
        └── blobs ──────→ Your backend
                              └── POST /v1/verify (with API key)
                                        └── Kernaq Identity API
```

The API key **never lives in the browser**. The browser SDK captures and quality-checks. Your backend calls Kernaq with the key.

---

## Installation

```bash
npm install @kernaq/capture-web
```

---

## Quick start — full KYC flow

```typescript
import { CameraCapture } from '@kernaq/capture-web'

// 1. Open rear camera for document photo
const docCamera = new CameraCapture({
  videoElement: document.getElementById('doc-preview') as HTMLVideoElement,
  facingMode:   'environment', // rear camera
})
await docCamera.start()

// 2. Capture document — throws QUALITY_CHECK_FAILED if too blurry/dark/small
const docResult = await docCamera.capturePhoto()
docCamera.stop()

// 3. Open front camera for selfie + liveness
const selfieCamera = new CameraCapture({
  videoElement: document.getElementById('selfie-preview') as HTMLVideoElement,
  facingMode:   'user', // front camera
})
await selfieCamera.start()

// 4. Capture selfie
const selfieResult = await selfieCamera.capturePhoto()

// 5. Record liveness video (minimum 3 seconds)
selfieCamera.startRecording()
await new Promise(r => setTimeout(r, 4000)) // 4 second recording
const videoResult = await selfieCamera.stopRecording()
selfieCamera.stop()

// 6. Send blobs to YOUR backend — it calls Kernaq with the API key
const form = new FormData()
form.append('document',      docResult.blob,   'document.jpg')
form.append('selfie',        selfieResult.blob, 'selfie.jpg')
form.append('video',         videoResult.blob,  'liveness.webm')
form.append('document_type', 'national_id')
form.append('country',       'KEN')
form.append('reference',     'user_abc123')

const response = await fetch('/api/verify', { method: 'POST', body: form })
const result   = await response.json()

console.log(result.verdict)           // "pass" | "fail" | "review"
console.log(result.document_fields)   // { name, date_of_birth, ... }
```

---

## API reference

### `CameraCapture`

```typescript
import { CameraCapture } from '@kernaq/capture-web'

const camera = new CameraCapture({
  videoElement: HTMLVideoElement,   // your <video> element for preview
  facingMode:   'environment',      // 'environment' (rear) | 'user' (front)
  width:        1280,               // preferred width (default: 1280)
  height:       720,                // preferred height (default: 720)
  qualityConfig: {
    minBlurScore:  40,   // 0–100, default 40
    minBrightness: 30,   // 0–255, default 30
    maxBrightness: 220,  // 0–255, default 220
    minFillRatio:  0.15, // 0–1, default 0.15
  },
})
```

#### `camera.start(): Promise<void>`

Opens the camera and attaches the stream to the `videoElement`. Throws `CAMERA_PERMISSION_DENIED` if the user denies access, `CAMERA_NOT_FOUND` if no camera exists.

#### `camera.capturePhoto(mime?): Promise<CaptureResult>`

Captures a still frame from the live stream. Runs the pre-flight quality check. Throws `QUALITY_CHECK_FAILED` if the image fails any threshold.

```typescript
const result = await camera.capturePhoto('image/jpeg')
// result.blob        — the image Blob
// result.mimeType    — "image/jpeg"
// result.quality     — { passed, blurScore, brightness, fillRatio, failures }
```

#### `camera.startRecording(mimeType?): void`

Starts a `MediaRecorder` session. Defaults to `video/webm;codecs=vp9`, falls back to `video/webm` if unsupported.

#### `camera.stopRecording(): Promise<CaptureResult>`

Stops recording and returns the video `Blob` with quality analysis of the first frame.

#### `camera.stop(): void`

Stops the camera and releases the hardware track.

---

### `analyseImage(blob, config?): Promise<QualityReport>`

Run the quality check on any image Blob directly, without opening a camera.

```typescript
import { analyseImage } from '@kernaq/capture-web'

const report = await analyseImage(someBlob, { minBlurScore: 50 })

console.log(report.passed)      // true | false
console.log(report.blurScore)   // 0–100
console.log(report.brightness)  // 0–255
console.log(report.fillRatio)   // 0–1
console.log(report.failures)    // e.g. ["too_blurry", "too_dark"]
```

---

## Quality check reference

| Check | Default threshold | Failure code |
|-------|-----------------|--------------|
| Blur (Laplacian variance, 0–100) | ≥ 40 | `too_blurry` |
| Brightness (0–255 luminance) | ≥ 30 | `too_dark` |
| Brightness ceiling | ≤ 220 | `too_bright` |
| Fill ratio (subject vs frame) | ≥ 0.15 (15%) | `too_small` |

---

## Error handling

```typescript
import { CameraCapture } from '@kernaq/capture-web'

try {
  await camera.start()
  const photo = await camera.capturePhoto()
} catch (err: unknown) {
  const e = err as { code?: string; message?: string }

  switch (e.code) {
    case 'CAMERA_PERMISSION_DENIED':
      showMessage('Please allow camera access and try again.')
      break
    case 'CAMERA_NOT_FOUND':
      showMessage('No camera found on this device.')
      break
    case 'QUALITY_CHECK_FAILED':
      showMessage('Image quality too low. Move to better light and try again.')
      // e.failures — array of specific failures: ["too_blurry", "too_dark"]
      break
    case 'BROWSER_NOT_SUPPORTED':
      showMessage('Your browser does not support camera access.')
      break
  }
}
```

---

## Low-bandwidth mode (3 frames instead of video)

For devices with poor connectivity, capture 3 frames instead of recording video:

```typescript
const selfieCamera = new CameraCapture({ videoElement, facingMode: 'user' })
await selfieCamera.start()

// Capture 3 frames 1 second apart
const frame1 = await selfieCamera.capturePhoto()
await new Promise(r => setTimeout(r, 1000))
const frame2 = await selfieCamera.capturePhoto()
await new Promise(r => setTimeout(r, 1000))
const frame3 = await selfieCamera.capturePhoto()
selfieCamera.stop()

// Send frames to your backend instead of video
const form = new FormData()
form.append('document', docResult.blob, 'document.jpg')
form.append('selfie',   selfieResult.blob, 'selfie.jpg')
form.append('frame_1',  frame1.blob, 'frame1.jpg')
form.append('frame_2',  frame2.blob, 'frame2.jpg')
form.append('frame_3',  frame3.blob, 'frame3.jpg')
form.append('document_type', 'national_id')
form.append('country',       'KEN')
form.append('reference',     'user_abc123')
```

---

## Quality score feedback UI

Use the quality report to give users real-time feedback:

```typescript
// Capture with lower thresholds first, then show feedback
const report = await analyseImage(photoBlob, { minBlurScore: 0 })

if (!report.passed) {
  if (report.failures.includes('too_blurry')) {
    showOverlay('Hold still — image is blurry')
  } else if (report.failures.includes('too_dark')) {
    showOverlay('Move to better lighting')
  } else if (report.failures.includes('too_bright')) {
    showOverlay('Reduce glare — move away from direct light')
  } else if (report.failures.includes('too_small')) {
    showOverlay('Move the document closer to the camera')
  }
} else {
  // Auto-capture once quality is good enough
  captureAndUpload()
}
```

---

## Backend integration (Express.js)

```typescript
import express from 'express'
import multer  from 'multer'
import Kernaq  from '@kernaq/identity'

const app    = express()
const upload = multer({ storage: multer.memoryStorage() })
const kernaq = new Kernaq()

app.post('/api/verify', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie',   maxCount: 1 },
  { name: 'video',    maxCount: 1 },
  { name: 'frame_1',  maxCount: 1 },
  { name: 'frame_2',  maxCount: 1 },
  { name: 'frame_3',  maxCount: 1 },
]), async (req, res) => {
  const f = req.files as Record<string, Express.Multer.File[]>

  const result = await kernaq.verify.run({
    document:     f.document[0].buffer,
    selfie:       f.selfie[0].buffer,
    video:        f.video?.[0]?.buffer,
    frame1:       f.frame_1?.[0]?.buffer,
    frame2:       f.frame_2?.[0]?.buffer,
    frame3:       f.frame_3?.[0]?.buffer,
    documentType: req.body.document_type,
    country:      req.body.country,
  })

  // Store result in your database here — Kernaq does not store any data
  res.json(result)
})
```

---

## License

See `LICENSE` in the repository root.
