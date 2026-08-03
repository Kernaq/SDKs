import { BaseClient, type FileInput } from './client.js'
import type {
  FaceDetectRequest,
  FaceDetectResponse,
  FaceMatchRequest,
  FaceMatchResponse,
} from './types.js'

export class FaceResource extends BaseClient {

  /**
   * Detect a face in an image and return bounding box + attributes (synchronous).
   *
   * @example
   * const result = await kernaq.face.detect({
   *   image: fs.createReadStream('selfie.jpg'),
   * })
   * console.log(result.detected, result.confidence)
   */
  detect(req: FaceDetectRequest): Promise<FaceDetectResponse> {
    return this.upload<FaceDetectResponse>('/face/detect', {}, [
      {
        field:       'image',
        value:       req.image as FileInput,
        filename:    req.imageName ?? 'image.jpg',
        contentType: 'image/jpeg',
      },
    ])
  }

  /**
   * Compare two face images and return a similarity score (synchronous).
   * Fields sent to the API: `face_a` and `face_b`.
   *
   * @example
   * const result = await kernaq.face.match({
   *   faceA: fs.createReadStream('id-photo.jpg'),
   *   faceB: fs.createReadStream('selfie.jpg'),
   * })
   * console.log(result.matched, result.confidence) // true, 99.2
   */
  match(req: FaceMatchRequest): Promise<FaceMatchResponse> {
    return this.upload<FaceMatchResponse>('/face/match', {}, [
      {
        field:       'face_a',
        value:       req.faceA as FileInput,
        filename:    req.faceAName ?? 'face_a.jpg',
        contentType: 'image/jpeg',
      },
      {
        field:       'face_b',
        value:       req.faceB as FileInput,
        filename:    req.faceBName ?? 'face_b.jpg',
        contentType: 'image/jpeg',
      },
    ])
  }
}
