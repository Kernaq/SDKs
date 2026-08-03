import { BaseClient, type FileInput } from './client.js'
import type { LivenessCheckRequest, LivenessCheckResponse } from './types.js'

export class LivenessResource extends BaseClient {

  /**
   * Check a video (or frame sequence) for liveness.
   * Detects replay attacks and spoof attempts (synchronous).
   *
   * Supply `video` OR `frame1` + `frame2` + `frame3`.
   *
   * @example
   * const result = await kernaq.liveness.check({
   *   video: fs.createReadStream('liveness.mp4'),
   * })
   * console.log(result.passed) // true
   */
  check(req: LivenessCheckRequest): Promise<LivenessCheckResponse> {
    const files: Array<{ field: string; value: FileInput; filename: string; contentType: string }> = []

    if (req.video) {
      files.push({
        field:       'video',
        value:       req.video as FileInput,
        filename:    req.videoName ?? 'liveness.mp4',
        contentType: 'video/mp4',
      })
    } else if (req.frame1 && req.frame2 && req.frame3) {
      files.push(
        { field: 'frame_1', value: req.frame1 as FileInput, filename: req.frame1Name ?? 'frame_1.jpg', contentType: 'image/jpeg' },
        { field: 'frame_2', value: req.frame2 as FileInput, filename: req.frame2Name ?? 'frame_2.jpg', contentType: 'image/jpeg' },
        { field: 'frame_3', value: req.frame3 as FileInput, filename: req.frame3Name ?? 'frame_3.jpg', contentType: 'image/jpeg' },
      )
    }

    return this.upload<LivenessCheckResponse>('/liveness/check', {}, files)
  }
}
