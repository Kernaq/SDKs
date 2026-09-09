/**
 * SelfieStep — auto-captures when face quality passes.
 *
 * Every 120ms:
 *   1. takeSnapshot (quality 20) — tiny file, fast
 *   2. analyseSelfieFrame() — brightness, blur, glare checks (mirrors web SDK)
 *   3. Shows live guidance pill with the first failing check message
 *   4. After HOLD_FRAMES consecutive passing frames (~1.5s) → takePhoto (full quality)
 */
import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { Camera, useCameraDevice } from 'react-native-vision-camera'
import { analyseSelfieFrame } from '../quality'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

const HOLD_FRAMES = 12   // ~1.5s at 120ms per frame

interface Props {
  theme:     ResolvedTheme
  locale:    VerifyLocale
  onCapture: (uri: string) => void
}

export function SelfieStep({ theme, locale, onCapture }: Props) {
  const cameraRef    = useRef<Camera>(null)
  const device       = useCameraDevice('front')
  const [pill, setPill]       = useState('Align your face')
  const [pillOk, setPillOk]   = useState(false)
  const [capturing, setCapturing] = useState(false)
  const readyFrames  = useRef(0)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const borderAnim   = useRef(new Animated.Value(0)).current   // 0 = white, 1 = green
  const s = styles(theme)

  // Animate oval border colour
  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: pillOk ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [pillOk, borderAnim])

  const ovalBorder = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.75)', '#4ade80'],
  })

  useEffect(() => {
    if (!device || capturing) return

    timerRef.current = setInterval(async () => {
      if (!cameraRef.current || capturing) return
      try {
        // Fast low-quality snapshot for analysis only
        const snap = await cameraRef.current.takeSnapshot({ quality: 20 })
        const uri  = `file://${snap.path}`

        const { passing, message } = await analyseSelfieFrame(uri, {
          minBlurScore:  22,
          minBrightness: 40,
          maxBrightness: 220,
        })

        setPill(passing ? 'Hold still\u2026' : message)
        setPillOk(passing)

        if (passing) {
          readyFrames.current++
        } else {
          readyFrames.current = 0
        }

        if (readyFrames.current >= HOLD_FRAMES) {
          // Stop loop, take full-quality photo
          clearInterval(timerRef.current!)
          timerRef.current = null
          setCapturing(true)
          const full = await cameraRef.current.takePhoto({ qualityPrioritization: 'quality' })
          onCapture(`file://${full.path}`)
        }
      } catch {
        readyFrames.current = 0
      }
    }, 120)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [device, capturing, onCapture])

  if (!device) return <ActivityIndicator color={theme.accent} style={{ margin: 40 }} />

  return (
    <View style={s.container}>
      <View style={s.heading}>
        <Text style={s.title}>{locale.selfie_title}</Text>
        <Text style={s.subtitle}>{locale.selfie_instruction}</Text>
      </View>

      <View style={s.viewport}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!capturing}
          photo
        />

        {/* Oval guide with animated border */}
        <Animated.View
          style={[s.oval, { borderColor: ovalBorder }]}
          pointerEvents="none"
        />

        {/* Live guidance pill */}
        <View style={[s.pill, pillOk && s.pillOk]} pointerEvents="none">
          <Text style={s.pillText}>{pill}</Text>
        </View>
      </View>

      {capturing && (
        <View style={s.capturingRow}>
          <ActivityIndicator color={theme.accent} size="small" />
          <Text style={s.capturingText}>Capturing…</Text>
        </View>
      )}
    </View>
  )
}

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
    viewport: {
      flex: 1,
      borderRadius: t.radius - 4,
      overflow: 'hidden',
      backgroundColor: '#000',
      position: 'relative',
    },
    oval: {
      position: 'absolute',
      left: '21%',
      right: '21%',
      top: '6%',
      bottom: '6%',
      borderWidth: 2,
      borderRadius: 999,
    },
    pill: {
      position: 'absolute',
      bottom: 14,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    pillOk: {
      backgroundColor: 'rgba(22,163,74,0.8)',
      borderColor: 'rgba(134,239,172,0.5)',
    },
    pillText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    capturingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    capturingText: {
      fontSize: 13,
      color: t.subtext,
    },
  })
