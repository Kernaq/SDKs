/**
 * @kernaq/capture-web
 *
 * Headless capture SDK for web browsers.
 *
 * What this SDK does:
 *  1. Opens the device camera invisibly behind your own UI.
 *  2. Runs a pre-flight quality check (blur, brightness, fill ratio) before
 *     the image is sent anywhere — rejects bad captures at the device.
 *  3. Returns captured blobs your backend uses to call the Kernaq Identity API.
 *
 * Architecture:
 *  Browser (this SDK) → captures and quality-checks → sends blobs to your backend
 *  Your backend → calls Kernaq Identity API with API key + blobs
 *
 * The API key never lives in the browser.
 *
 * @example
 * ```ts
 * import { CameraCapture } from '@kernaq/capture-web'
 *
 * // 1. Capture document photo
 * const docCamera = new CameraCapture({
 *   videoElement: document.getElementById('doc-preview') as HTMLVideoElement,
 *   facingMode: 'environment', // rear camera for document
 * })
 * await docCamera.start()
 * const docResult = await docCamera.capturePhoto() // throws if too blurry / dark
 * docCamera.stop()
 *
 * // 2. Capture selfie
 * const selfieCamera = new CameraCapture({
 *   videoElement: document.getElementById('selfie-preview') as HTMLVideoElement,
 *   facingMode: 'user', // front camera for selfie
 * })
 * await selfieCamera.start()
 * const selfieResult = await selfieCamera.capturePhoto()
 *
 * // 3. Record liveness video (3 seconds minimum)
 * selfieCamera.startRecording()
 * await new Promise(r => setTimeout(r, 3000))
 * const videoResult = await selfieCamera.stopRecording()
 * selfieCamera.stop()
 *
 * // 4. Send blobs to YOUR backend, which calls POST /v1/verify
 * const formData = new FormData()
 * formData.append('document', docResult.blob, 'document.jpg')
 * formData.append('selfie', selfieResult.blob, 'selfie.jpg')
 * formData.append('video', videoResult.blob, 'liveness.webm')
 * formData.append('document_type', 'national_id')
 * formData.append('country', 'KEN')
 * formData.append('reference', 'user_abc123')
 *
 * const result = await fetch('/api/verify', { method: 'POST', body: formData })
 * ```
 */

export { CameraCapture } from './camera'
export { analyseImage, analyseVideoFrame } from './quality'
export { submitVerification } from './submit'
export * from './types'
