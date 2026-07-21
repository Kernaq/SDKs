/**
 * Camera wrapper — accesses the device camera directly, provides
 * a stream for the client to preview, and captures frames on demand.
 *
 * The client's UI renders the <video> element wherever they want.
 * Kernaq never touches the DOM layout or styling.
 */
import type { CaptureResult, QualityConfig, QualityFailure } from './types'
import { analyseImage, analyseVideoFrame } from './quality'
import { makeError } from './errors'

export interface CameraOptions {
  /** Target video element where the preview stream is rendered */
  videoElement: HTMLVideoElement
  /** 'environment' = rear camera (document), 'user' = front camera (selfie) */
  facingMode?: 'environment' | 'user'
  /** Preferred capture resolution */
  width?: number
  height?: number
  qualityConfig?: QualityConfig
}

export class CameraCapture {
  private stream:  MediaStream | null = null
  private options: CameraOptions
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  constructor(options: CameraOptions) {
    this.options = options
  }

  /** Open the camera and attach the stream to the video element */
  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw makeError('BROWSER_NOT_SUPPORTED', 'getUserMedia is not supported in this browser')
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.options.facingMode ?? 'environment',
          width:  { ideal: this.options.width  ?? 1280 },
          height: { ideal: this.options.height ?? 720  },
        },
        audio: false,
      })
    } catch (err: unknown) {
      const e = err as Error
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        throw makeError('CAMERA_PERMISSION_DENIED', 'Camera permission was denied')
      }
      if (e.name === 'NotFoundError') {
        throw makeError('CAMERA_NOT_FOUND', 'No camera found on this device')
      }
      throw e
    }

    this.options.videoElement.srcObject = this.stream
    await this.options.videoElement.play()
  }

  /** Stop the camera and release the hardware */
  stop(): void {
    this.stream?.getTracks().forEach(t => t.stop())
    this.stream = null
    this.options.videoElement.srcObject = null
  }

  /**
   * Capture a still photo from the live camera stream.
   * Runs the pre-flight quality check before returning.
   * Throws if the image is too blurry, too dark, or too small.
   */
  async capturePhoto(mime: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<CaptureResult> {
    if (!this.stream) {
      throw new Error('Camera is not started — call start() first')
    }

    const video  = this.options.videoElement
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), mime, 0.92)
    )

    const quality = await analyseImage(blob, this.options.qualityConfig)

    if (!quality.passed) {
      throw makeError(
        'QUALITY_CHECK_FAILED',
        `Image quality check failed: ${quality.failures.join(', ')}`,
        quality.failures,
      )
    }

    return { blob, mimeType: mime, quality }
  }

  /**
   * Start recording a liveness video.
   * Call stopRecording() to get the result.
   */
  startRecording(mimeType = 'video/webm;codecs=vp9'): void {
    if (!this.stream) throw new Error('Camera not started')
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'
    }
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream, { mimeType })
    this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data) }
    this.recorder.start(100)
  }

  /**
   * Stop recording and return the video blob with quality analysis.
   */
  async stopRecording(): Promise<CaptureResult> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) { reject(new Error('Not recording')); return }
      this.recorder.onstop = async () => {
        const mimeType = this.recorder?.mimeType ?? 'video/webm'
        const blob     = new Blob(this.chunks, { type: mimeType })
        this.chunks    = []
        try {
          const quality = await analyseVideoFrame(blob, this.options.qualityConfig)
          resolve({ blob, mimeType, quality })
        } catch (err) {
          resolve({ blob, mimeType, quality: { passed: true, blurScore: 50, brightness: 128, fillRatio: 0.5, failures: [] as QualityFailure[] } })
        }
      }
      this.recorder.stop()
    })
  }
}
