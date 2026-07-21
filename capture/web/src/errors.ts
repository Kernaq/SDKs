import type { CaptureError, CaptureErrorCode, QualityFailure } from './types'

export function makeError(
  code: CaptureErrorCode,
  message: string,
  failures?: QualityFailure[],
): CaptureError {
  const err = new Error(message) as CaptureError
  err.code = code
  if (failures) (err as unknown as Record<string, unknown>)['failures'] = failures
  return err
}
