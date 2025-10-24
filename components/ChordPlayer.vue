<script setup lang="ts">
/**
 * EXAMPLE: Playing multiple oscillators (a chord)
 * Demonstrates handling multiple audio nodes + waveform visualization
 */

import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'

const oscillators: OscillatorNode[] = []

// A major chord: C4 (261.63 Hz), E4 (329.63 Hz), G4 (392.00 Hz)
const frequencies = [261.63, 329.63, 392.00]

const { isPlaying, toggle, masterGain } = useAudioDemo({
  onSetup: (ctx, destination) => {
    const nodes: AudioNode[] = []

    frequencies.forEach(freq => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.33, ctx.currentTime)

      osc.connect(gain)
      gain.connect(destination)

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
  <AudioDemo :is-playing="isPlaying" :master-gain="masterGain" play-label="🔊 Play C Major Chord"
    stop-label="🔇 Stop Chord" :description="isPlaying ? 'Playing C-E-G (C Major)' : 'Multiple oscillators example'"
    @toggle="toggle">
    <WaveformVisualizer :source="masterGain" :fullscreen="true" />
  </AudioDemo>
</template>