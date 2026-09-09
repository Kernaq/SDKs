import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

interface Props {
  theme:  ResolvedTheme
  locale: VerifyLocale
}

export function ProcessingStep({ theme, locale }: Props) {
  const s = styles(theme)
  return (
    <View style={s.container}>
      <ActivityIndicator color={theme.accent} size="large" />
      <Text style={s.title}>{locale.processing_title}</Text>
      <Text style={s.subtitle}>This usually takes under 10 seconds.</Text>
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 32,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: t.subtext,
      textAlign: 'center',
    },
  })
