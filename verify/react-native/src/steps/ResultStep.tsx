import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale, VerifyResult, VerifyVerdict } from '../types'

interface Props {
  theme: ResolvedTheme
  locale: VerifyLocale
  result: VerifyResult | null
  error: string | null
  onRetry: () => void
}

const ICONS: Record<VerifyVerdict, string> = {
  pass:   '✅',
  fail:   '❌',
  review: '⏳',
}

const ICON_BG: Record<VerifyVerdict, string> = {
  pass:   '#d1fae5',
  fail:   '#fee2e2',
  review: '#fef3c7',
}

export function ResultStep({ theme, locale, result, error, onRetry }: Props) {
  const s = styles(theme)

  if (!result) {
    return (
      <View style={s.container}>
        <View style={[s.iconWrap, { backgroundColor: '#fee2e2' }]}>
          <Text style={s.icon}>❌</Text>
        </View>
        <Text style={s.title}>{locale.result_fail_title}</Text>
        <Text style={s.body}>{error ?? locale.result_fail_body}</Text>
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={s.btnText}>{locale.result_retry_btn}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const titles: Record<VerifyVerdict, string> = {
    pass:   locale.result_pass_title,
    fail:   locale.result_fail_title,
    review: locale.result_review_title,
  }
  const bodies: Record<VerifyVerdict, string> = {
    pass:   locale.result_pass_body,
    fail:   locale.result_fail_body,
    review: locale.result_review_body,
  }

  return (
    <View style={s.container}>
      <View style={[s.iconWrap, { backgroundColor: ICON_BG[result.verdict] }]}>
        <Text style={s.icon}>{ICONS[result.verdict]}</Text>
      </View>
      <Text style={s.title}>{titles[result.verdict]}</Text>
      <Text style={s.body}>{bodies[result.verdict]}</Text>
      {result.verdict === 'fail' && (
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={s.btnText}>{locale.result_retry_btn}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      padding: 40,
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    icon: { fontSize: 34 },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
    },
    body: {
      fontSize: 14,
      color: t.subtext,
      textAlign: 'center',
      lineHeight: 21,
    },
    btn: {
      marginTop: 8,
      backgroundColor: t.accent,
      borderRadius: t.radius,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  })
