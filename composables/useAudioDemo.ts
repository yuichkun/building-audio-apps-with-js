import { ref } from 'vue'
import { useAudioContext } from './useAudioContext'

export type AudioSetupCallback = (ctx: AudioContext) => AudioNode[] | AudioNode | void
export type AudioCleanupCallback = () => void

export interface UseAudioDemoOptions {
  /**
   * Called when audio starts. Receives AudioContext and should return nodes to disconnect on stop.
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
}

/**
 * High-level composable for creating audio demos.
 * Handles AudioContext lifecycle and node cleanup.
 *
 * @example
 * ```ts
 * const { isPlaying, toggle } = useAudioDemo({
 *   onSetup: (ctx) => {
 *     const osc = ctx.createOscillator()
 *     osc.connect(ctx.destination)
 *     osc.start()
 *     return osc
 *   }
 * })
 * ```
 */
export function useAudioDemo(options: UseAudioDemoOptions): UseAudioDemoReturn {
  const { isPlaying, start: startContext, stop: stopContext } = useAudioContext()
  const nodes = ref<AudioNode[]>([])

  function start(): void {
    if (isPlaying.value) return

    const ctx = startContext()
    const result = options.onSetup(ctx)

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
  }
}
