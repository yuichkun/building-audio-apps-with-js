<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebGPUConvolution, type IRPreset } from '../composables/useWebGPUConvolution'
import { useConvolutionReverb } from '../composables/useConvolutionReverb'
import WaveformVisualizer from './WaveformVisualizer.vue'

const gpu = useWebGPUConvolution()
const audio = useConvolutionReverb()

const currentPreset = ref<IRPreset>('room')
const wetValue = ref(0)

// dB scale for volume: -60dB to 0dB
const MIN_DB = -60
const MAX_DB = 0
const volumeDb = ref(-9) // Start at -12dB (reasonable default)

// Convert dB to linear gain: gain = 10^(dB/20)
function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

// Computed display value for volume
const displayDb = computed(() => {
  return volumeDb.value === MIN_DB ? '-∞' : `${volumeDb.value.toFixed(1)} dB`
})

async function initialize() {
  try {
    await gpu.initializeGPU()
    if (gpu.isSupported.value) {
      await audio.loadAudioFile('/sample.wav')
      audio.setVolume(dbToGain(volumeDb.value)) // Set initial volume
    }
  } catch (err) {
    console.error('Initialization failed:', err)
  }
}

function triggerSound() {
  audio.trigger()
}

function updateIR() {
  audio.setIRPreset(currentPreset.value)
}

function updateWetMix() {
  audio.setWetMix(wetValue.value)
}

function updateVolume() {
  const gain = dbToGain(volumeDb.value)
  audio.setVolume(gain)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 't' || e.key === 'T') {
    triggerSound()
  }
}

onMounted(() => {
  initialize()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="convolution-reverb-demo">
    <!-- WebGPU Support Check -->
    <div v-if="gpu.error.value" class="error-message">
      <div>{{ gpu.error.value }}</div>
      <div class="browser-help">
        WebGPU requires Chrome 113+ or Edge 113+.
        <a href="https://caniuse.com/webgpu" target="_blank" rel="noopener">Check browser compatibility</a>
      </div>
    </div>

    <!-- Controls -->
    <div v-else-if="gpu.isSupported.value" class="controls">
      <div class="control-row">
        <button @click="triggerSound" :disabled="!audio.audioReady.value" class="trigger-button">
          Trigger Sound ( t )
        </button>

        <label class="control-label">
          IR Preset:
          <select v-model="currentPreset" @change="updateIR" class="preset-select">
            <option value="room">Room</option>
            <option value="hall">Hall</option>
            <option value="plate">Plate</option>
            <option value="box">Wood Box</option>
          </select>
        </label>
      </div>
      <div class="flex flex-col gap-2">
        <div class="control-group">
          <span class="control-label-text">Wet Mix:</span>
          <span class="control-value">{{ wetValue.toFixed(2) }}</span>
          <input type="range" v-model.number="wetValue" @input="updateWetMix" min="0" max="1" step="0.01"
            class="control-slider" />
        </div>

        <div class="control-group">
          <span class="control-label-text">Volume:</span>
          <span class="control-value">{{ displayDb }}</span>
          <input type="range" v-model.number="volumeDb" @input="updateVolume" :min="MIN_DB" :max="MAX_DB" step="1"
            class="control-slider" />
        </div>
      </div>

      <!-- Waveform Visualization -->
      <WaveformVisualizer v-if="audio.outputNode.value" :source="audio.outputNode.value" :width="600" :height="150" />

      <div class="status">{{ audio.statusMessage.value }}</div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading">
      Initializing WebGPU...
    </div>
  </div>
</template>

<style scoped>
.convolution-reverb-demo {
  padding: 1rem;
  width: 100%;
}

.error-message {
  color: #ff6b6b;
  padding: 1rem;
  border: 1px solid #ff6b6b;
  border-radius: 0.25rem;
  background: rgba(255, 107, 107, 0.1);
}

.browser-help {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.browser-help a {
  color: #4dabf7;
  text-decoration: underline;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.trigger-button {
  padding: 0.5rem 1rem;
  border: 1px solid #42b883;
  border-radius: 0.25rem;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.trigger-button:hover:not(:disabled) {
  background: rgba(66, 184, 131, 0.1);
}

.trigger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #6b7280;
}

.preset-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #888;
  border-radius: 0.25rem;
  background: #333;
  color: white;
  font-size: 0.875rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-label-text {
  min-width: 70px;
  font-size: 0.875rem;
  font-weight: 500;
}

.control-value {
  min-width: 80px;
  font-size: 0.875rem;
  font-family: monospace;
  text-align: right;
  color: #42b883;
}

.control-slider {
  width: 150px;
}

.status {
  font-size: 0.75rem;
  color: #888;
  padding: 0.5rem 0;
}

.loading {
  padding: 1rem;
  text-align: center;
  color: #888;
}
</style>
