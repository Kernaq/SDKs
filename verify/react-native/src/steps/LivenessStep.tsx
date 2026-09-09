/**
 * LivenessStep — randomised action challenges shown as an overlay on the camera feed.
 * Tasks: blink twice, turn left, turn right, nod, open mouth.
 * Instruction is overlaid at the bottom of the viewport (mirrors web v2).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { Camera, useCameraDevice } from 'react-native-vision-camera'
import { useCamera } from '../hooks/useCamera'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale, LivenessTask } from '../types'

interface TaskDef {
  id:       LivenessTask
  label:    string
  duration: number
}

const TASK_POOL: TaskDef[] = [
  { id: 'blink',       label: 'Blink twice',         duration: 3000 },
  { id: 'turn-left',   label: 'Turn your head left',  duration: 3000 },
  { id: 'turn-right',  label: 'Turn your head right', duration: 3000 },
  { id: 'nod',         label: 'Nod your head',        duration: 3000 },
  { id: 'open-mouth',  label: 'Open your mouth',      duration: 3000 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

interface Props {
  theme:         ResolvedTheme
  locale:        VerifyLocale
  duration:      number
  taskCount?:    number
  onCapture:     (uri: string) => void
}

export function LivenessStep({ theme, locale, duration, taskCount = 2, onCapture }: Props) {
  const { cameraRef, startRecording, stopRecording } = useCamera('front')
  const device = useCameraDevice('front')

  const tasks = useMemo(() => shuffle(TASK_POOL).slice(0, Math.min(taskCount, TASK_POOL.length)), [taskCount])

  const [taskIdx,    setTaskIdx]    = useState(0)
  const [started,    setStarted]    = useState(false)   // task in progress
  const [taskDone,   setTaskDone]   = useState(0)       // completed tasks count
  const [progress,   setProgress]   = useState(0)       // 0–100 for current task bar
  const [complete,   setComplete]   = useState(false)
  const [recording,  setRecording]  = useState(false)

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const taskTimer     = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const pulseAnim     = useRef(new Animated.Value(1)).current

  // Pulse REC dot
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
    }
  }, [recording, pulseAnim])

  const startTask = () => {
    if (!recording) {
      // Begin recording when first task starts
      startRecording(
        (video) => { onCapture(video.uri) },
        () => {}
      )
      setRecording(true)
    }

    const task = tasks[taskIdx]
    if (!task) return
    setStarted(true)
    setProgress(0)

    const start = Date.now()
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / task.duration) * 100)
      setProgress(pct)
      if (elapsed >= task.duration) {
        clearInterval(progressTimer.current!)
        progressTimer.current = null
        nextTask()
      }
    }, 80)
  }

  const nextTask = () => {
    const next = taskIdx + 1
    setTaskDone(prev => prev + 1)
    if (next >= tasks.length) {
      finishLiveness()
      return
    }
    setTaskIdx(next)
    setStarted(false)
    setProgress(0)
    // Short pause then auto-start next task
    taskTimer.current = setTimeout(() => startTask(), 500)
  }

  const finishLiveness = () => {
    setComplete(true)
    taskTimer.current = setTimeout(() => {
      stopRecording()
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
      if (taskTimer.current)     clearTimeout(taskTimer.current)
    }
  }, [])

  if (!device) return <ActivityIndicator color={theme.accent} style={{ margin: 40 }} />

  const currentTask = tasks[taskIdx]
  const s = styles(theme)

  return (
    <View style={s.container}>
      <View style={s.heading}>
        <Text style={s.title}>{complete ? locale.liveness_complete : locale.liveness_title}</Text>
        {!complete && <Text style={s.subtitle}>{locale.liveness_ready}</Text>}
      </View>

      {/* Task progress dots */}
      {!complete && (
        <View style={s.taskDots}>
          {tasks.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i < taskDone  && s.dotDone,
                i === taskIdx && s.dotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Camera with in-viewport overlay */}
      <View style={s.viewport}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          video
          audio={false}
        />

        <View style={s.ovalGuide} pointerEvents="none" />

        {/* Recording badge */}
        {recording && (
          <View style={s.recBadge}>
            <Animated.View style={[s.recDot, { opacity: pulseAnim }]} />
            <Text style={s.recText}>REC</Text>
          </View>
        )}

        {/* Instruction overlay — always visible on video */}
        {currentTask && !complete && (
          <View style={s.overlay}>
            <View style={s.overlayPill}>
              <Text style={s.overlayNum}>{taskIdx + 1}/{tasks.length}</Text>
              <Text style={s.overlayLabel}>{currentTask.label}</Text>
            </View>
            {started && (
              <View style={s.barWrap}>
                <View style={[s.barFill, { width: `${progress}%` }]} />
              </View>
            )}
          </View>
        )}

        {complete && (
          <View style={s.overlay}>
            <View style={s.overlayPill}>
              <Text style={s.overlayLabel}>{locale.liveness_complete}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Begin button — only shown before first task starts */}
      {!started && !complete && currentTask && taskDone === 0 && (
        <TouchableOpacity style={s.btn} onPress={startTask} activeOpacity={0.85}>
          <Text style={s.btnText}>Begin</Text>
          <Text style={s.btnArrow}> →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, gap: 12 },
    heading:   { gap: 4, alignItems: 'center' },
    title: {
      fontSize: 20, fontWeight: '700', color: t.text,
      textAlign: 'center', letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13, color: t.subtext, lineHeight: 19, textAlign: 'center',
    },
    taskDots: { flexDirection: 'row', gap: 6 },
    dot: {
      flex: 1, height: 2.5, borderRadius: 999, backgroundColor: t.border,
    },
    dotDone:   { backgroundColor: t.accent, opacity: 0.35 },
    dotActive: { backgroundColor: t.accent },
    viewport: {
      flex: 1, borderRadius: t.radius - 4, overflow: 'hidden',
      backgroundColor: '#000', position: 'relative',
    },
    ovalGuide: {
      position: 'absolute', left: '21%', right: '21%', top: '6%', bottom: '6%',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.75)', borderRadius: 999,
    },
    recBadge: {
      position: 'absolute', top: 10, left: 10,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)',
      borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4,
    },
    recDot: {
      width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ef4444',
    },
    recText: { color: '#ef4444', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    overlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12,
      gap: 8,
      backgroundColor: 'transparent',
      // Gradient-like: darker at bottom via background trick
    },
    overlayPill: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    overlayNum: {
      fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    overlayLabel: {
      fontSize: 15, fontWeight: '700', color: '#fff',
    },
    barWrap: {
      height: 3, backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999, overflow: 'hidden',
    },
    barFill: {
      height: '100%', backgroundColor: '#fff', borderRadius: 999,
    },
    btn: {
      backgroundColor: t.accent, borderRadius: t.radius - 4,
      paddingVertical: 12, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
    },
    btnText: { color: t.accentInv, fontSize: 14, fontWeight: '600' },
    btnArrow: { color: t.accentInv, fontSize: 14, fontWeight: '600' },
  })
