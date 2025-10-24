<script setup lang="ts">
import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'

let oscillator: OscillatorNode | null = null

const { isPlaying, toggle, masterGain } = useAudioDemo({
  onSetup: (ctx, destination) => {
    oscillator = ctx.createOscillator()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, ctx.currentTime)

    oscillator.connect(destination)
    oscillator.start()

    return oscillator
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
    :master-gain="masterGain"
    @toggle="toggle"
  />
</template>
