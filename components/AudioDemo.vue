<script setup lang="ts">
import { computed } from 'vue'

export interface AudioDemoProps {
  isPlaying: boolean
  label?: string
  playLabel?: string
  stopLabel?: string
  description?: string
}

const props = withDefaults(defineProps<AudioDemoProps>(), {
  label: 'Audio Demo',
  playLabel: '🔊 Play',
  stopLabel: '🔇 Stop',
  description: '',
})

const emit = defineEmits<{
  toggle: []
}>()

const buttonText = computed(() => {
  return props.isPlaying ? props.stopLabel : props.playLabel
})

const statusText = computed(() => {
  if (props.description) {
    return props.description
  }
  return props.isPlaying ? 'Playing...' : 'Click to play'
})
</script>

<template>
  <div class="audio-demo">
    <div class="audio-demo-controls">
      <button
        @click="emit('toggle')"
        class="audio-demo-button"
        :class="isPlaying ? 'audio-demo-button--stop' : 'audio-demo-button--play'"
      >
        {{ buttonText }}
      </button>
      <p class="audio-demo-status">
        {{ statusText }}
      </p>
    </div>

    <div v-if="$slots.default" class="audio-demo-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.audio-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
}

.audio-demo-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.audio-demo-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.audio-demo-button--play {
  background-color: #3b82f6;
}

.audio-demo-button--play:hover {
  background-color: #2563eb;
}

.audio-demo-button--stop {
  background-color: #ef4444;
}

.audio-demo-button--stop:hover {
  background-color: #dc2626;
}

.audio-demo-status {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.6;
}

.audio-demo-content {
  width: 100%;
  max-width: 600px;
}
</style>
