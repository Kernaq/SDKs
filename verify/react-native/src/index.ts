/**
 * @kernaq/verify-react-native
 *
 * Drop-in KYC verification UI for React Native.
 * Works with bare React Native and Expo (requires expo prebuild).
 *
 * Usage:
 *   import { KernaqVerify } from '@kernaq/verify-react-native'
 *
 *   <KernaqVerify
 *     visible={showVerify}
 *     apiKey="k_test_..."
 *     country="KEN"
 *     onComplete={(result) => console.log(result.verdict)}
 *     onCancel={() => setShowVerify(false)}
 *   />
 *
 * Peer dependencies:
 *   react-native-vision-camera >= 4
 *   react-native-permissions >= 4
 */

export { KernaqVerify } from './KernaqVerify'
export type {
  VerifyConfig,
  VerifyResult,
  VerifyStep,
  VerifyVerdict,
  VerifyTheme,
  VerifyLocale,
  DocumentType,
} from './types'
