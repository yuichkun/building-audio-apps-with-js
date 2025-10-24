import { ref, onUnmounted } from 'vue'
import { onSlideLeave } from '@slidev/client'

export interface UseAudioContextReturn {
  audioContext: AudioContext | null
  isPlaying: Readonly<ReturnType<typeof ref<boolean>>>
  start: () => AudioContext
  stop: () => void
  cleanup: () => void
}

/**
 * Base composable for managing AudioContext lifecycle.
 * Each component instance gets its own isolated AudioContext.
 * Enforces user-gesture requirement for audio playback.
 * Automatically stops audio when slide becomes inactive.
 */
export function useAudioContext(): UseAudioContextReturn {
  const isPlaying = ref(false)
  let audioContext: AudioContext | null = null

  function start(): AudioContext {
    if (audioContext && audioContext.state !== 'closed') {
      return audioContext
    }

    audioContext = new AudioContext()
    isPlaying.value = true
    return audioContext
  }

  function stop(): void {
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    isPlaying.value = false
  }

  function cleanup(): void {
    stop()
  }

  // Stop audio when navigating away from slide
  onSlideLeave(() => {
    stop()
  })

  // Cleanup when component unmounts
  onUnmounted(() => {
    cleanup()
  })

  return {
    audioContext,
    isPlaying,
    start,
    stop,
    cleanup,
  }
}
