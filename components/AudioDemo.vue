<script setup lang="ts">
import { computed } from 'vue'
import VolumeControl from './VolumeControl.vue'

export interface AudioDemoProps {
  isPlaying: boolean | undefined
  masterGain?: GainNode | null
  label?: string
  playLabel?: string
  stopLabel?: string
}

const props = withDefaults(defineProps<AudioDemoProps>(), {
  masterGain: null,
  label: 'Audio Demo',
  playLabel: 'play',
  stopLabel: 'stop',
  description: '',
})

const emit = defineEmits<{
  toggle: []
}>()

const buttonText = computed(() => {
  return props.isPlaying ? props.stopLabel : props.playLabel
})

</script>

<template>
  <div class="audio-demo">
    <div class="audio-demo-controls">
      <button @click="emit('toggle')" class="audio-demo-button"
        :class="isPlaying ? 'audio-demo-button--stop' : 'audio-demo-button--play'">
        {{ buttonText }}
      </button>
      <VolumeControl :gain-node="masterGain" />
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
  height: 100%;
  overflow: scroll;
}

.audio-demo-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.audio-demo-button {
  width: 82px;
  padding: 0.45rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border-width: 1px;
  color: white;
  transition: all 0.2s ease;
}

.audio-demo-button--play {
  border-color: #cbcbcb;
}

.audio-demo-button--play:hover {
  background-color: #42b883;
  border-color: transparent;
}

.audio-demo-button--stop {
  background-color: #ef4444;
  border-color: transparent;
}

.audio-demo-button--stop:hover {
  background-color: #dc2626;
  border-color: #cbcbcb;
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
