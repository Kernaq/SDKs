/**
 * DocumentStep — captures front then back of document.
 * Corner bracket guides, hint strip, no extra back navigation.
 */
import React, { useState } from 'react'
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

import { analyseImageUri } from '../quality'

interface Props {
  theme:    ResolvedTheme
  locale:   VerifyLocale
  side:     'front' | 'back'
  /** URI from the front capture, shown as thumbnail on back step */
  frontUri?: string
  onCapture: (uri: string) => void
  /** Only shown on back step — lets user retake the front */
  onRetakeFront?: () => void
}

export function DocumentStep({ theme, locale, side, frontUri, onCapture, onRetakeFront }: Props) {
  const { cameraRef, device, capturePhoto } = useCamera('back')
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const s = styles(theme)

  const handleCapture = async () => {
    if (!cameraRef.current) return
    setCapturing(true)
    setError(null)
    const result = await capturePhoto()
    if (!result) {
      setError(locale.error_blur)
      setCapturing(false)
      return
    }
    // Run same quality checks as web SDK
    const report = await analyseImageUri(result.uri, {
      minBlurScore:  20,
      minBrightness: 30,
      maxBrightness: 230,
      minFillRatio:  0.05,
    })
    setCapturing(false)
    if (!report.passed) {
      const msgs: Record<string, string> = {
        too_blurry: locale.error_blur,
        too_dark:   'Move to better lighting',
        too_bright: 'Reduce brightness or move away from light',
        too_small:  'Move closer to the document',
      }
      setError(msgs[report.failures[0]!] ?? locale.error_quality)
      return
    }
    onCapture(result.uri)
  }

  const title       = side === 'front' ? locale.doc_front_title       : locale.doc_back_title
  const instruction = side === 'front' ? locale.doc_front_instruction : locale.doc_back_instruction
  const hint        = side === 'front'
    ? 'Hold the camera parallel to the document. Move closer if text is hard to read.'
    : 'Flip the document over and keep it flat inside the frame.'

  if (!device) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Heading */}
      <View style={s.heading}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{instruction}</Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Front thumbnail on back step */}
      {side === 'back' && frontUri ? (
        <View style={s.thumbRow}>
          <Image source={{ uri: frontUri }} style={s.thumb} resizeMode="cover" />
          <Text style={s.thumbLabel}>&#10003; Front captured</Text>
        </View>
      ) : null}

      {/* Camera */}
      <View style={s.viewport}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
        />
        {/* Corner bracket guides */}
        <View style={s.frameGuide} pointerEvents="none">
          <View style={[s.corner, s.tl]} />
          <View style={[s.corner, s.tr]} />
          <View style={[s.corner, s.bl]} />
          <View style={[s.corner, s.br]} />
        </View>
        {/* Dim overlay outside frame */}
        <View style={s.dimOverlay} pointerEvents="none" />
      </View>

      {/* Hint */}
      <View style={s.hint}>
        <Text style={s.hintText}>{hint}</Text>
      </View>

      {/* Capture button */}
      <TouchableOpacity
        style={[s.btn, capturing && s.btnDisabled]}
        onPress={handleCapture}
        disabled={capturing}
        activeOpacity={0.85}
      >
        {capturing
          ? <ActivityIndicator color={theme.accentInv} />
          : <Text style={s.btnText}>{locale.doc_capture_btn}</Text>
        }
      </TouchableOpacity>

      {/* Retake front (back step only) */}
      {side === 'back' && onRetakeFront ? (
        <TouchableOpacity style={s.btnGhost} onPress={onRetakeFront} activeOpacity={0.75}>
          <Text style={s.btnGhostText}>{locale.doc_retake_btn} front</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const CORNER_SIZE = 20
const CORNER_W    = 2

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      gap: 12,
    },
    heading: { gap: 4, alignItems: 'center' },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      color: t.subtext,
      lineHeight: 19,
      textAlign: 'center',
    },
    errorBanner: {
      backgroundColor: t.errorBg,
      borderRadius: 8,
      padding: 10,
    },
    errorText: {
      fontSize: 12.5,
      color: t.errorText,
      lineHeight: 17,
    },
    thumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      backgroundColor: t.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    thumb: {
      width: 48,
      height: 32,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: t.border,
    },
    thumbLabel: {
      fontSize: 12,
      color: t.subtext,
    },
    viewport: {
      flex: 1,
      borderRadius: t.radius - 4,
      overflow: 'hidden',
      backgroundColor: '#000',
      position: 'relative',
    },
    frameGuide: {
      position: 'absolute',
      top: '8%',
      left: '6%',
      right: '6%',
      bottom: '8%',
    },
    corner: {
      position: 'absolute',
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      borderColor: 'rgba(255,255,255,0.9)',
    },
    tl: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 3 },
    tr: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 3 },
    bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 3 },
    br: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 3 },
    dimOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'transparent',
    },
    hint: {
      flexDirection: 'row',
      gap: 7,
      padding: 9,
      backgroundColor: t.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    hintText: {
      flex: 1,
      fontSize: 12,
      color: t.subtext,
      lineHeight: 16,
    },
    btn: {
      backgroundColor: t.accent,
      borderRadius: t.radius - 4,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    btnText: {
      color: t.accentInv,
      fontSize: 14,
      fontWeight: '600',
    },
    btnGhost: {
      borderRadius: t.radius - 4,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: 'transparent',
    },
    btnGhostText: {
      color: t.subtext,
      fontSize: 13.5,
      fontWeight: '500',
    },
  })
