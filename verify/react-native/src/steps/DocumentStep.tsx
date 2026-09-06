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
}

export function DocumentStep({ theme, locale, onCapture }: Props) {
  const { cameraRef, device, capturePhoto } = useCamera('back')
  const [preview, setPreview] = React.useState<string | null>(null)
  const [capturing, setCapturing] = React.useState(false)
  const s = styles(theme)

  const handleCapture = async () => {
    setCapturing(true)
    const result = await capturePhoto()
    setCapturing(false)
    if (result) setPreview(result.uri)
  }

  const handleConfirm = () => {
    if (preview) onCapture(preview)
  }

  if (!device) {
    return (
      <View style={s.container}>
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>{locale.doc_title}</Text>
      <Text style={s.subtitle}>{locale.doc_instruction}</Text>

      {preview ? (
        <>
          <Image source={{ uri: preview }} style={s.preview} resizeMode="cover" />
          <TouchableOpacity style={s.btnPrimary} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={s.btnText}>{locale.doc_next_btn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setPreview(null)} activeOpacity={0.75}>
            <Text style={s.btnSecondaryText}>{locale.doc_retake_btn}</Text>
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
            {/* Document frame guide */}
            <View style={s.frameGuide} pointerEvents="none" />
          </View>
          <TouchableOpacity
            style={[s.btnPrimary, capturing && s.btnDisabled]}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.85}
          >
            {capturing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{locale.doc_capture_btn}</Text>
            }
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
      aspectRatio: 4 / 3,
      borderRadius: t.radius,
      overflow: 'hidden',
      backgroundColor: '#000',
      marginBottom: 16,
      position: 'relative',
    },
    frameGuide: {
      position: 'absolute',
      top: '8%',
      left: '5%',
      right: '5%',
      bottom: '8%',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.7)',
      borderRadius: 8,
    },
    preview: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: t.radius,
      marginBottom: 16,
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
