<script setup lang="ts">
import { ref, watch, computed } from 'vue'

export interface VolumeControlProps {
  gainNode: GainNode | null
}

const props = defineProps<VolumeControlProps>()

// dB scale: -60dB to 0dB
const MIN_DB = -60
const MAX_DB = 0

const currentDb = ref(MIN_DB) // Start at minimum (silent)

// Convert dB to gain: gain = 10^(dB/20)
function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

// Update gain node when slider changes
watch(currentDb, (db) => {
  if (props.gainNode) {
    const gain = dbToGain(db)
    props.gainNode.gain.setValueAtTime(gain, props.gainNode.context.currentTime)
  }
})

// Reset to minimum when gain node changes
watch(() => props.gainNode, (node) => {
  if (node) {
    currentDb.value = MIN_DB
  }
})

const displayDb = computed(() => {
  return currentDb.value === MIN_DB ? '-∞' : `${currentDb.value.toFixed(1)} dB`
})
</script>

<template>
  <div class="volume-control">
    <div class="volume-slider-container">
      <span class="volume-value">{{ displayDb }}</span>
      <input v-model.number="currentDb" type="range" :min="MIN_DB" :max="MAX_DB" step="1" class="volume-slider"
        orient="vertical" />
    </div>
    <label class="volume-label">
      Volume
    </label>
  </div>
</template>

<style scoped>
.volume-control {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.volume-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  opacity: 0.8;
}

.volume-slider-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.volume-slider {
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
  height: 8rem;
  width: 0.75rem;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.volume-slider::-moz-range-track {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: background 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #2563eb;
}

.volume-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  background: #2563eb;
}

.volume-value {
  width: 80px;
  font-size: 0.875rem;
  font-family: monospace;
  text-align: center;
  opacity: 0.9;
}
</style>
