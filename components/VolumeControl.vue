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
  <div v-if="gainNode" class="volume-control">
    <label class="volume-label">
      🔊 Volume
    </label>
    <div class="volume-slider-container">
      <input
        v-model.number="currentDb"
        type="range"
        :min="MIN_DB"
        :max="MAX_DB"
        step="1"
        class="volume-slider"
      />
      <span class="volume-value">{{ displayDb }}</span>
    </div>
  </div>
</template>

<style scoped>
.volume-control {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.volume-label {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.8;
}

.volume-slider-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: background 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #2563eb;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
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
  font-size: 0.875rem;
  font-family: monospace;
  min-width: 4rem;
  text-align: right;
  opacity: 0.9;
}
</style>
