import { BaseClient, type FileInput } from './client.js'
import type { LivenessCheckRequest, LivenessCheckResponse } from './types.js'

export class LivenessResource extends BaseClient {

  /**
   * Check a video for liveness — detects replay attacks and spoof attempts
   * (synchronous).
   *
   * @example
   * const result = await kernaq.liveness.check({
   *   video: fs.createReadStream('liveness.mp4'),
   * })
   * console.log(result.passed) // true
   */
  check(req: LivenessCheckRequest): Promise<LivenessCheckResponse> {
    return this.upload<LivenessCheckResponse>('/liveness/check', {}, [
      {
        field:       'video',
        value:       req.video as FileInput,
        filename:    req.videoName ?? 'liveness.mp4',
        contentType: 'video/mp4',
      },
    ])
  }
}
