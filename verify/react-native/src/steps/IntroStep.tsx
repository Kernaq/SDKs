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
      <View style={s.textBlock}>
        <Text style={s.title}>{locale.intro_title}</Text>
        <Text style={s.subtitle}>{locale.intro_body}</Text>
      </View>

      {/* Privacy hint */}
      <View style={s.hint}>
        <Text style={s.hintIcon}>&#x1F512;</Text>
        <Text style={s.hintText}>
          Your data is discarded immediately after processing. Nothing is stored.
        </Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={onStart} activeOpacity={0.85}>
        <Text style={s.btnText}>{locale.intro_cta}</Text>
        <Text style={s.btnArrow}> →</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 28,
      justifyContent: 'center',
      gap: 16,
    },
    textBlock: {
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      color: t.subtext,
      lineHeight: 21,
      textAlign: 'center',
    },
    hint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      backgroundColor: t.surface,
      borderRadius: t.radius - 4,
      borderWidth: 1,
      borderColor: t.border,
    },
    hintIcon: {
      fontSize: 12,
      marginTop: 1,
    },
    hintText: {
      flex: 1,
      fontSize: 12,
      color: t.subtext,
      lineHeight: 17,
    },
    btn: {
      backgroundColor: t.accent,
      borderRadius: t.radius - 4,
      paddingVertical: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      color: t.accentInv,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    btnArrow: {
      color: t.accentInv,
      fontSize: 14,
      fontWeight: '600',
    },
  })
