import { BaseClient, type FileInput } from './client.js'
import type {
  ExtractDocumentRequest,
  ExtractDocumentResponse,
  ValidateDocumentRequest,
  ValidateDocumentResponse,
} from './types.js'

export class DocumentsResource extends BaseClient {

  /**
   * Extract structured fields from a document image (synchronous).
   *
   * @example
   * const data = await kernaq.documents.extract({
   *   document:     fs.createReadStream('passport.jpg'),
   *   documentType: 'passport',
   *   country:      'GBR',
   * })
   * console.log(data.fields.first_name) // 'John'
   */
  extract(req: ExtractDocumentRequest): Promise<ExtractDocumentResponse> {
    const fields: Record<string, string> = {}
    if (req.documentType) fields['document_type'] = req.documentType
    if (req.country)      fields['country']       = req.country

    return this.upload<ExtractDocumentResponse>('/documents/extract', fields, [
      {
        field:       'document',
        value:       req.document as FileInput,
        filename:    req.documentName ?? 'document.jpg',
        contentType: 'image/jpeg',
      },
    ])
  }

  /**
   * Validate a document — returns validity flags without full OCR (synchronous).
   *
   * @example
   * const result = await kernaq.documents.validate({
   *   document:     fs.createReadStream('id.jpg'),
   *   documentType: 'national_id',
   * })
   * console.log(result.valid) // true
   */
  validate(req: ValidateDocumentRequest): Promise<ValidateDocumentResponse> {
    const fields: Record<string, string> = {}
    if (req.documentType) fields['document_type'] = req.documentType
    if (req.country)      fields['country']       = req.country

    return this.upload<ValidateDocumentResponse>('/documents/validate', fields, [
      {
        field:       'document',
        value:       req.document as FileInput,
        filename:    req.documentName ?? 'document.jpg',
        contentType: 'image/jpeg',
      },
    ])
  }
}
