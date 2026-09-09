/**
 * @kernaq/verify-react-native v2
 *
 * Drop-in KYC verification UI for React Native.
 * Matches @kernaq/verify web v2.0.0 — same flow, same API surface.
 *
 * Usage:
 *   import { KernaqVerify } from '@kernaq/verify-react-native'
 *
 *   <KernaqVerify
 *     visible={showVerify}
 *     documentType="national_id"
 *     country="KEN"
 *     reference={userId}
 *     steps={['document', 'selfie', 'liveness']}
 *     onComplete={(result) => console.log(result.verdict)}
 *   />
 *
 * Peer dependencies:
 *   react-native-vision-camera >= 4
 *   react-native-permissions >= 4
 */

export { KernaqVerify } from './KernaqVerify'
export { analyseImageUri, analyseSelfieFrame } from './quality'
export type { QualityReport, QualityConfig, QualityFailure } from './quality'
export type {
  VerifyConfig,
  VerifyResult,
  VerifyStep,
  VerifyStepName,
  VerifyVerdict,
  VerifyTheme,
  VerifyLocale,
  DocumentType,
  LivenessTask,
} from './types'
