<script setup lang="ts">
/**
 * EXAMPLE: Playing multiple oscillators (a chord)
 * Demonstrates handling multiple audio nodes
 */

import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'

const oscillators: OscillatorNode[] = []

// A major chord: C4 (261.63 Hz), E4 (329.63 Hz), G4 (392.00 Hz)
const frequencies = [261.63, 329.63, 392.00]

const { isPlaying, toggle } = useAudioDemo({
  onSetup: (ctx) => {
    const nodes: AudioNode[] = []
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime)
    masterGain.connect(ctx.destination)
    nodes.push(masterGain)

    frequencies.forEach(freq => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.33, ctx.currentTime)

      osc.connect(gain)
      gain.connect(masterGain)

      osc.start()

      oscillators.push(osc)
      nodes.push(osc, gain)
    })

    return nodes
  },
  onCleanup: () => {
    oscillators.forEach(osc => osc.stop())
    oscillators.length = 0
  }
})
</script>

<template>
  <AudioDemo
    :is-playing="isPlaying as boolean"
    play-label="🔊 Play C Major Chord"
    stop-label="🔇 Stop Chord"
    :description="isPlaying ? 'Playing C-E-G (C Major)' : 'Multiple oscillators example'"
    @toggle="toggle"
  />
</template>
