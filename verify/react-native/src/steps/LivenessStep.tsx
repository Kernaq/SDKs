import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { Camera } from 'react-native-vision-camera'
import { useCamera } from '../hooks/useCamera'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

interface Props {
  theme: ResolvedTheme
  locale: VerifyLocale
  duration: number       // ms
  onCapture: (uri: string) => void
  onBack: () => void
}

export function LivenessStep({ theme, locale, duration, onCapture, onBack }: Props) {
  const { cameraRef, device, startRecording, stopRecording } = useCamera('front')
  const [recording, setRecording] = useState(false)
  const [countdown, setCountdown] = useState(Math.ceil(duration / 1000))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const s = styles(theme)

  // Pulse animation for recording indicator
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [recording, pulseAnim])

  const handleStart = () => {
    if (!cameraRef.current) return
    setRecording(true)
    setCountdown(Math.ceil(duration / 1000))

    startRecording(
      (video) => {
        setRecording(false)
        onCapture(video.uri)
      },
      () => setRecording(false)
    )

    // Countdown tick
    let remaining = duration / 1000
    timerRef.current = setInterval(() => {
      remaining -= 0.1
      setCountdown(Math.max(0, Math.ceil(remaining)))
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        stopRecording()
      }
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!device) return <ActivityIndicator color={theme.accent} style={{ margin: 40 }} />

  return (
    <View style={s.container}>
      <Text style={s.title}>{locale.liveness_title}</Text>
      <Text style={s.subtitle}>
        {recording ? locale.liveness_recording : locale.liveness_instruction}
      </Text>

      <View style={s.viewport}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
        <View style={s.ovalGuide} pointerEvents="none" />

        {recording && (
          <>
            <View style={s.recBadge}>
              <Animated.View style={[s.recDot, { opacity: pulseAnim }]} />
              <Text style={s.recText}>REC</Text>
            </View>
            <View style={s.countdownBadge}>
              <Text style={s.countdownText}>{countdown}</Text>
            </View>
          </>
        )}
      </View>

      {!recording && (
        <>
          <TouchableOpacity style={s.btnPrimary} onPress={handleStart} activeOpacity={0.85}>
            <Text style={s.btnText}>{locale.liveness_start_btn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={onBack} activeOpacity={0.75}>
            <Text style={s.btnSecondaryText}>{locale.selfie_retake_btn}</Text>
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
      alignSelf: 'center',
      maxWidth: 280,
      position: 'relative',
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
    recBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(220,38,38,0.85)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 6,
    },
    recDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
    },
    recText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    countdownBadge: {
      position: 'absolute',
      bottom: 12,
      alignSelf: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    countdownText: { color: '#fff', fontSize: 18, fontWeight: '700' },
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
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    btnSecondaryText: { color: t.text, fontSize: 15, fontWeight: '600' },
  })
