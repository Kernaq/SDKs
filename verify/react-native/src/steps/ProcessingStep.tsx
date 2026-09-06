import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale } from '../types'

interface Props {
  theme: ResolvedTheme
  locale: VerifyLocale
}

export function ProcessingStep({ theme, locale }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current
  const s = styles(theme)

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start()
  }, [spinAnim])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={s.container}>
      <Animated.View style={[s.spinner, { transform: [{ rotate: spin }] }]} />
      <Text style={s.title}>{locale.processing_title}</Text>
      <Text style={s.subtitle}>{locale.processing_subtitle}</Text>
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      padding: 48,
      alignItems: 'center',
      gap: 16,
    },
    spinner: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 4,
      borderColor: t.border,
      borderTopColor: t.accent,
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: t.subtext,
      textAlign: 'center',
    },
  })
