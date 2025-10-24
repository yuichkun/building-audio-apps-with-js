import { ref } from 'vue'
import { useAudioContext } from './useAudioContext'

export type AudioSetupCallback = (ctx: AudioContext, destination: AudioNode) => AudioNode[] | AudioNode | void
export type AudioCleanupCallback = () => void

export interface UseAudioDemoOptions {
  /**
   * Called when audio starts. Receives AudioContext and destination (master gain node).
   * Connect your audio nodes to the destination parameter instead of ctx.destination.
   * The master gain defaults to -60dB (silent) for safety.
   */
  onSetup: AudioSetupCallback
  /**
   * Optional custom cleanup logic. Called before stopping AudioContext.
   */
  onCleanup?: AudioCleanupCallback
}

export interface UseAudioDemoReturn {
  isPlaying: Readonly<ReturnType<typeof ref<boolean>>>
  toggle: () => void
  start: () => void
  stop: () => void
  masterGain: Readonly<ReturnType<typeof ref<GainNode | null>>>
}

/**
 * High-level composable for creating audio demos.
 * Handles AudioContext lifecycle and node cleanup.
 * Automatically creates a master gain node (defaults to -60dB for safety).
 *
 * @example
 * ```ts
 * const { isPlaying, toggle, masterGain } = useAudioDemo({
 *   onSetup: (ctx, destination) => {
 *     const osc = ctx.createOscillator()
 *     osc.connect(destination)  // Connect to master gain, not ctx.destination
 *     osc.start()
 *     return osc
 *   }
 * })
 * ```
 */
export function useAudioDemo(options: UseAudioDemoOptions): UseAudioDemoReturn {
  const { isPlaying, start: startContext, stop: stopContext } = useAudioContext()
  const nodes = ref<AudioNode[]>([])
  const masterGain = ref<GainNode | null>(null)

  function start(): void {
    if (isPlaying.value) return

    const ctx = startContext()

    // Create master gain node (defaults to -60dB / silent)
    masterGain.value = ctx.createGain()
    masterGain.value.gain.setValueAtTime(0.001, ctx.currentTime) // -60dB
    masterGain.value.connect(ctx.destination)

    // Pass master gain as destination to user's setup
    const result = options.onSetup(ctx, masterGain.value)

    if (result) {
      nodes.value = Array.isArray(result) ? result : [result]
    }
  }

  function stop(): void {
    if (!isPlaying.value) return

    if (options.onCleanup) {
      options.onCleanup()
    }

    nodes.value.forEach(node => {
      try {
        node.disconnect()
      } catch (e) {
        // Node might already be disconnected
      }
    })
    nodes.value = []

    // Clean up master gain
    if (masterGain.value) {
      masterGain.value.disconnect()
      masterGain.value = null
    }

    stopContext()
  }

  function toggle(): void {
    if (isPlaying.value) {
      stop()
    } else {
      start()
    }
  }

  return {
    isPlaying,
    toggle,
    start,
    stop,
    masterGain,
  }
}
