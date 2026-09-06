import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

interface Props {
  theme: ResolvedTheme
  locale: VerifyLocale
  onStart: () => void
}

export function IntroStep({ theme, locale, onStart }: Props) {
  const s = styles(theme)
  return (
    <View style={s.container}>
      <View style={s.steps}>
        {[
          { icon: '🪪', label: 'Document' },
          { icon: '🤳', label: 'Selfie' },
          { icon: '👁️', label: 'Liveness' },
        ].map((item) => (
          <View key={item.label} style={s.step}>
            <View style={s.stepIcon}>
              <Text style={s.stepEmoji}>{item.icon}</Text>
            </View>
            <Text style={s.stepLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.title}>{locale.intro_title}</Text>
      <Text style={s.body}>{locale.intro_body}</Text>

      <TouchableOpacity style={s.btn} onPress={onStart} activeOpacity={0.85}>
        <Text style={s.btnText}>{locale.intro_cta}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: { padding: 24 },
    steps: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginBottom: 28,
    },
    step: { alignItems: 'center', gap: 8 },
    stepIcon: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepEmoji: { fontSize: 24 },
    stepLabel: { fontSize: 12, color: t.subtext },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: t.text,
      marginBottom: 10,
    },
    body: {
      fontSize: 14,
      color: t.subtext,
      lineHeight: 21,
      marginBottom: 28,
    },
    btn: {
      backgroundColor: t.accent,
      borderRadius: t.radius,
      paddingVertical: 14,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  })
