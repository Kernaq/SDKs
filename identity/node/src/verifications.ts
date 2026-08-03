import { BaseClient, type FileInput } from './client.js'
import type { VerifyRequest, VerifyResult } from './types.js'

export class VerificationsResource extends BaseClient {

  /**
   * Run a full live KYC verification. Charges a credit.
   * Blocks 3–8 seconds, returns the result directly.
   *
   * Liveness: supply `video` OR `frame1` + `frame2` + `frame3`.
   *
   * @example
   * const result = await kernaq.verify.run({
   *   document:     fs.createReadStream('id.jpg'),
   *   selfie:       fs.createReadStream('selfie.jpg'),
   *   video:        fs.createReadStream('liveness.mp4'),
   *   documentType: 'national_id',
   *   country:      'KEN',
   * })
   * if (result.verdict === 'pass') { ... }
   */
  run(req: VerifyRequest): Promise<VerifyResult> {
    return this.uploadVerify('/verify', req)
  }

  /**
   * Run verification through the sandbox pipeline — same logic, no billing.
   *
   * @example
   * const result = await kernaq.verify.sandbox({
   *   document:     fs.createReadStream('id.jpg'),
   *   selfie:       fs.createReadStream('selfie.jpg'),
   *   video:        fs.createReadStream('liveness.mp4'),
   *   documentType: 'passport',
   *   country:      'GBR',
   * })
   */
  sandbox(req: VerifyRequest): Promise<VerifyResult> {
    return this.uploadVerify('/verify/sandbox', req)
  }

  private uploadVerify(path: string, req: VerifyRequest): Promise<VerifyResult> {
    const fields: Record<string, string> = {
      document_type: req.documentType,
      country:       req.country,
    }

    const files: Array<{ field: string; value: FileInput; filename: string; contentType: string }> = [
      {
        field:       'document',
        value:       req.document as FileInput,
        filename:    req.documentName ?? 'document.jpg',
        contentType: contentTypeFromName(req.documentName ?? 'document.jpg'),
      },
      {
        field:       'selfie',
        value:       req.selfie as FileInput,
        filename:    req.selfieName ?? 'selfie.jpg',
        contentType: contentTypeFromName(req.selfieName ?? 'selfie.jpg'),
      },
    ]

    if (req.video) {
      files.push({
        field:       'video',
        value:       req.video as FileInput,
        filename:    req.videoName ?? 'liveness.mp4',
        contentType: contentTypeFromName(req.videoName ?? 'liveness.mp4'),
      })
    } else if (req.frame1 && req.frame2 && req.frame3) {
      files.push(
        { field: 'frame_1', value: req.frame1 as FileInput, filename: req.frame1Name ?? 'frame_1.jpg', contentType: 'image/jpeg' },
        { field: 'frame_2', value: req.frame2 as FileInput, filename: req.frame2Name ?? 'frame_2.jpg', contentType: 'image/jpeg' },
        { field: 'frame_3', value: req.frame3 as FileInput, filename: req.frame3Name ?? 'frame_3.jpg', contentType: 'image/jpeg' },
      )
    }

    return this.upload<VerifyResult>(path, fields, files)
  }
}

function contentTypeFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',  heic: 'image/heic',
    pdf: 'application/pdf',
    mp4: 'video/mp4',  mov: 'video/quicktime', webm: 'video/webm',
  }
  return map[ext] ?? 'application/octet-stream'
}
