<script setup lang="ts">
import { ref } from 'vue'

const noiseGain = ref(0.01)
const freq = ref(220)
let granularNode: AudioWorkletNode | null = null
let oscillator: OscillatorNode | null = null
let context: AudioContext | null = null

const onStart = async () => {
  console.log('start')
  context = new AudioContext()
  await context.audioWorklet.addModule('simple-granular-processor.js')
  oscillator = new OscillatorNode(context)
  oscillator.frequency.value = freq.value
  granularNode = new AudioWorkletNode(context, 'simple-granular-processor')
  oscillator.connect(granularNode).connect(context.destination)
  oscillator.start()
}

const onNoiseGainInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  noiseGain.value = value
  if (granularNode && context) {
    granularNode.parameters.get('noiseGain')?.setValueAtTime(value, context.currentTime)
  }
}

const onFreqInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  freq.value = value
  if (oscillator && context) {
    oscillator.frequency.setValueAtTime(value, context.currentTime)
  }
}
</script>

<template>
  <div class="container">
    <div class="start-button">
      <button @click="onStart">start</button>
    </div>
    <div style="margin-top: 1em">
      <label>
        noiseGain: {{ noiseGain }}
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          :value="noiseGain"
          @input="onNoiseGainInput"
        />
      </label>
    </div>
    <div style="margin-top: 1em">
      <label>
        freq: {{ freq }} Hz
        <input type="range" min="20" max="2000" step="1" :value="freq" @input="onFreqInput" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2em;
}
.start-button {
  width: 100%;
  display: flex;
  justify-content: center;
}
label {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.1em;
  gap: 0.5em;
}
input[type='range'] {
  width: 300px;
  margin-top: 0.5em;
}
</style>
