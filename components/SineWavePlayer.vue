<script setup lang="ts">
import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'

let oscillator: OscillatorNode | null = null

const { isPlaying, toggle } = useAudioDemo({
  onSetup: (ctx) => {
    oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start()

    return [oscillator, gainNode]
  },
  onCleanup: () => {
    if (oscillator) {
      oscillator.stop()
      oscillator = null
    }
  }
})
</script>

<template>
  <AudioDemo
    :is-playing="Boolean(isPlaying)"
    @toggle="toggle"
  />
</template>
