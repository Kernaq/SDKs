import { useState, useCallback } from 'react'
import { Platform, Linking, Alert } from 'react-native'
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  type Permission,
} from 'react-native-permissions'

export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'blocked'

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>('unknown')

  const cameraPermission: Permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA

  const micPermission: Permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const camResult = await check(cameraPermission)

      if (camResult === RESULTS.GRANTED) {
        // Also request mic for liveness video
        await request(micPermission)
        setStatus('granted')
        return true
      }

      if (camResult === RESULTS.BLOCKED) {
        setStatus('blocked')
        Alert.alert(
          'Camera Permission Required',
          'Camera access is blocked. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        )
        return false
      }

      // Request camera
      const result = await request(cameraPermission)
      if (result === RESULTS.GRANTED) {
        await request(micPermission)
        setStatus('granted')
        return true
      }

      setStatus('denied')
      return false
    } catch {
      setStatus('denied')
      return false
    }
  }, [cameraPermission, micPermission])

  return { status, requestPermissions }
}
