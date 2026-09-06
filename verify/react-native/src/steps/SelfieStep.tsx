import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Camera } from 'react-native-vision-camera'
import { useCamera } from '../hooks/useCamera'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

interface Props {
  theme: ResolvedTheme
  locale: VerifyLocale
  onCapture: (uri: string) => void
  onBack: () => void
}

export function SelfieStep({ theme, locale, onCapture, onBack }: Props) {
  const { cameraRef, device, capturePhoto } = useCamera('front')
  const [preview, setPreview] = React.useState<string | null>(null)
  const [capturing, setCapturing] = React.useState(false)
  const s = styles(theme)

  const handleCapture = async () => {
    setCapturing(true)
    const result = await capturePhoto()
    setCapturing(false)
    if (result) setPreview(result.uri)
  }

  if (!device) return <ActivityIndicator color={theme.accent} style={{ margin: 40 }} />

  return (
    <View style={s.container}>
      <Text style={s.title}>{locale.selfie_title}</Text>
      <Text style={s.subtitle}>{locale.selfie_instruction}</Text>

      {preview ? (
        <>
          <Image source={{ uri: preview }} style={s.preview} resizeMode="cover" />
          <TouchableOpacity style={s.btnPrimary} onPress={() => onCapture(preview)} activeOpacity={0.85}>
            <Text style={s.btnText}>{locale.selfie_next_btn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setPreview(null)} activeOpacity={0.75}>
            <Text style={s.btnSecondaryText}>{locale.selfie_retake_btn}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={s.viewport}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
            />
            {/* Oval face guide */}
            <View style={s.ovalGuide} pointerEvents="none" />
          </View>
          <TouchableOpacity
            style={[s.btnPrimary, capturing && s.btnDisabled]}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.85}
          >
            {capturing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{locale.selfie_capture_btn}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={onBack} activeOpacity={0.75}>
            <Text style={s.btnSecondaryText}>{locale.doc_retake_btn}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: { padding: 24 },
    title: { fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: t.subtext, lineHeight: 20, marginBottom: 16 },
    viewport: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: t.radius,
      overflow: 'hidden',
      backgroundColor: '#000',
      marginBottom: 16,
      position: 'relative',
      alignSelf: 'center',
      maxWidth: 280,
    },
    ovalGuide: {
      position: 'absolute',
      top: '8%',
      left: '12%',
      right: '12%',
      bottom: '8%',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.7)',
      borderRadius: 999,
    },
    preview: {
      width: 240,
      height: 320,
      borderRadius: t.radius,
      marginBottom: 16,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
    btnPrimary: {
      backgroundColor: t.accent,
      borderRadius: t.radius,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
    },
    btnSecondary: {
      backgroundColor: t.card,
      borderRadius: t.radius,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    btnSecondaryText: { color: t.text, fontSize: 15, fontWeight: '600' },
  })
