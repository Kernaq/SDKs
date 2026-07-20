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
   * Typically used to match the selfie against the photo on the ID document.
   *
   * @example
   * const result = await kernaq.face.match({
   *   imageA: fs.createReadStream('id-photo.jpg'),
   *   imageB: fs.createReadStream('selfie.jpg'),
   * })
   * console.log(result.matched, result.confidence) // true, 99.2
   */
  match(req: FaceMatchRequest): Promise<FaceMatchResponse> {
    return this.upload<FaceMatchResponse>('/face/match', {}, [
      {
        field:       'image_a',
        value:       req.imageA as FileInput,
        filename:    req.imageAName ?? 'image_a.jpg',
        contentType: 'image/jpeg',
      },
      {
        field:       'image_b',
        value:       req.imageB as FileInput,
        filename:    req.imageBName ?? 'image_b.jpg',
        contentType: 'image/jpeg',
      },
    ])
  }
}
