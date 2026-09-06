# @kernaq/verify-react-native

Official React Native SDK for [Kernaq Identity](https://kernaq.com) — a drop-in KYC verification component that handles document capture, selfie, and liveness detection in a single modal. Works with both bare React Native and Expo.

## Install

```bash
npm install @kernaq/verify-react-native react-native-vision-camera react-native-permissions
```

**Bare React Native — link native modules:**
```bash
cd ios && pod install
```

**Expo — generate native folders:**
```bash
npx expo install @kernaq/verify-react-native react-native-vision-camera react-native-permissions
npx expo prebuild
```

### Android permissions

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### iOS permissions

Add to `ios/<App>/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera is required to capture your ID document and selfie.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone is required to record the liveness video.</string>
```

## Quick start

```tsx
import React, { useState } from 'react'
import { Button, View } from 'react-native'
import { KernaqVerify } from '@kernaq/verify-react-native'

export default function App() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button title="Verify Identity" onPress={() => setVisible(true)} />

      <KernaqVerify
        visible={visible}
        apiKey="k_test_..."
        country="KEN"
        reference="user_abc123"
        onComplete={(result) => {
          console.log(result.verdict)        // "pass" | "fail" | "review"
          console.log(result.score)          // 0-100
          console.log(result.faceMatch)      // true | false
          console.log(result.documentFields) // { name, dob, document_number, ... }
          setVisible(false)
        }}
        onCancel={() => setVisible(false)}
        onError={(err) => console.error(err.code, err.message)}
      />
    </View>
  )
}
```

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `visible` | `boolean` | ✓ | Show or hide the verification modal |
| `apiKey` | `string` | * | Your Kernaq API key (`k_test_...` or `k_live_...`) |
| `backendUrl` | `string` | * | Backend proxy URL (use instead of `apiKey` for production) |
| `country` | `string` | | ISO 3166-1 alpha-3 country code. Default: `KEN` |
| `reference` | `string` | | Your internal user/session ID |
| `sandbox` | `boolean` | | Use sandbox mode — no billing. Default: `false` |
| `livenessDuration` | `number` | | Liveness recording duration in ms. Default: `3000` |
| `documentTypes` | `DocumentType[]` | | Document types to accept. Default: `['national_id', 'passport']` |
| `theme` | `VerifyTheme` | | Customise colours, border radius and font |
| `locale` | `Partial<VerifyLocale>` | | Override any displayed string |
| `onComplete` | `(result: VerifyResult) => void` | | Called when verification completes |
| `onCancel` | `() => void` | | Called when user dismisses without completing |
| `onError` | `(error) => void` | | Called on unrecoverable error |

*Either `apiKey` or `backendUrl` is required.

## Theming

```tsx
<KernaqVerify
  visible={visible}
  apiKey="k_test_..."
  theme={{
    accentColor: '#6366f1',
    backgroundColor: '#0f0f0f',
    textColor: '#f9fafb',
    mode: 'dark',
    borderRadius: 16,
  }}
  onComplete={handleComplete}
  onCancel={() => setVisible(false)}
/>
```

## Localisation

```tsx
<KernaqVerify
  visible={visible}
  apiKey="k_test_..."
  locale={{
    intro_title: 'Thibitisha utambulisho wako',
    intro_cta: 'Anza',
    result_pass_title: 'Umefaulu',
  }}
  onComplete={handleComplete}
  onCancel={() => setVisible(false)}
/>
```

## Using a backend proxy (recommended for production)

Never expose a live API key in your app. Instead, forward requests through your server:

```tsx
<KernaqVerify
  visible={visible}
  backendUrl="https://api.yourapp.com/kyc/verify"
  country="KEN"
  reference={userId}
  onComplete={handleComplete}
  onCancel={() => setVisible(false)}
/>
```

Your backend endpoint receives a `multipart/form-data` POST with `document`, `selfie`, `video`, `document_type`, `country`, and `reference` fields. Forward it to `https://api.identity.kernaq.com/v1/verify` with your secret key.

## Result object

```ts
interface VerifyResult {
  verificationId: string
  reference: string
  verdict: 'pass' | 'fail' | 'review'
  score: number                              // 0–100
  faceMatch: boolean
  isLive: boolean
  documentFields?: {
    name?: string
    first_name?: string
    last_name?: string
    date_of_birth?: string
    document_number?: string
    nationality?: string
    gender?: string
    expiry_date?: string
  }
}
```

## Peer dependencies

| Package | Version |
|---|---|
| `react` | `>=18.0.0` |
| `react-native` | `>=0.73.0` |
| `react-native-vision-camera` | `>=4.0.0` |
| `react-native-permissions` | `>=4.0.0` |

## Links

- [Documentation](https://kernaq.com/docs)
- [API Reference](https://kernaq.com/docs/api)
- [Dashboard](https://kernaq.com/dashboard)
- [GitHub](https://github.com/Kernaq/SDKs)
