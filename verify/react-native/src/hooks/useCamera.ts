import { useRef, useCallback } from 'react'
import {
  useCameraDevice,
  useCameraPermission,
  type Camera,
} from 'react-native-vision-camera'

export type CameraFacing = 'front' | 'back'

export interface CaptureResult {
  uri: string
  width: number
  height: number
}

export interface VideoResult {
  uri: string
  duration: number
}

export function useCamera(facing: CameraFacing = 'back') {
  const cameraRef = useRef<Camera>(null)
  const device = useCameraDevice(facing)
  const { hasPermission } = useCameraPermission()

  const capturePhoto = useCallback(async (): Promise<CaptureResult | null> => {
    if (!cameraRef.current) return null
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      })
      return {
        uri: `file://${photo.path}`,
        width: photo.width,
        height: photo.height,
      }
    } catch {
      return null
    }
  }, [])

  const startRecording = useCallback(
    (
      onFinished: (video: VideoResult) => void,
      onError: (err: unknown) => void
    ) => {
      if (!cameraRef.current) return
      cameraRef.current.startRecording({
        flash: 'off',
        onRecordingFinished: (video) => {
          onFinished({ uri: `file://${video.path}`, duration: video.duration })
        },
        onRecordingError: onError,
      })
    },
    []
  )

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current) return
    await cameraRef.current.stopRecording()
  }, [])

  return {
    cameraRef,
    device,
    hasPermission,
    capturePhoto,
    startRecording,
    stopRecording,
  }
}
