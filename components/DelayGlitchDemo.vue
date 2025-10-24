<script setup lang="ts">
import { ref } from 'vue'
import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'
// @ts-ignore
import processorUrl from '../lib/delay-glitch-processor.ts?worker&url'

const delayMs = ref(0)
const actualTimeMs = ref(0)
let workletNode: AudioWorkletNode | null = null

const { isPlaying, toggle, masterGain } = useAudioDemo({
  onSetup: (ctx, destination) => {
    ctx.audioWorklet.addModule(processorUrl).then(() => {
      workletNode = new AudioWorkletNode(ctx, 'delay-glitch-processor')
      workletNode.connect(destination)

      // Listen for timing updates from processor
      workletNode.port.onmessage = (e) => {
        if (e.data.actualTimeMs !== undefined) {
          actualTimeMs.value = e.data.actualTimeMs
        }
      }

      // Send initial delay parameter
      workletNode.port.postMessage({
        delayMs: delayMs.value,
      })
    })
  },
})

const onDelayInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  delayMs.value = value
  if (workletNode) {
    workletNode.port.postMessage({ delayMs: value })
  }
}

const isOverBudget = () => actualTimeMs.value > 3
</script>

<template>
  <AudioDemo :is-playing="isPlaying" :master-gain="masterGain" @toggle="toggle">
    <WaveformVisualizer :source="masterGain" :fullscreen="true" />

    <div class="demo-container">
      <div class="info-section">
        <div class="delay-display" :class="{ warning: isOverBudget() }">
          {{ actualTimeMs.toFixed(1) }}ms
        </div>
        <div class="subtitle">Actual Processing Time</div>
        <div class="threshold-indicator">
          <span class="threshold-label">3ms threshold</span>
          <div class="threshold-bar">
            <div class="threshold-marker" :style="{ left: '30%' }"></div>
            <div class="current-position" :style="{ width: `${Math.min(actualTimeMs * 10, 100)}%` }"
              :class="{ over: isOverBudget() }"></div>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>
            Artificial Processing Load
            <input type="range" min="0" max="10" step="0.01" :value="delayMs" @input="onDelayInput" />
          </label>
          <div class="range-labels">
            <span>0ms (safe)</span>
            <span :class="{ warning: isOverBudget() }">10ms (glitchy)</span>
          </div>
        </div>
      </div>
    </div>
  </AudioDemo>
</template>

<style scoped>
.demo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  padding: 1rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
}

.delay-display {
  font-size: 3rem;
  font-weight: 700;
  color: #42b883;
  transition: color 0.3s ease;
}

.delay-display.warning {
  color: #ff6b6b;
}

.subtitle {
  font-size: 1rem;
  color: #999;
  text-align: center;
  margin-top: -0.5rem;
}

.threshold-indicator {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.threshold-label {
  font-size: 0.9rem;
  color: #999;
  text-align: center;
}

.threshold-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.threshold-marker {
  position: absolute;
  top: 0;
  height: 100%;
  width: 2px;
  background: #ffd93d;
  z-index: 2;
}

.current-position {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #42b883;
  transition: all 0.2s ease;
}

.current-position.over {
  background: #ff6b6b;
}

.controls {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

input[type='range'] {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #999;
  width: 100%;
}

.range-labels .warning {
  color: #ff6b6b;
}
</style>
