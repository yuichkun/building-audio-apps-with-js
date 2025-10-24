<script setup lang="ts">
import VolumeControl from './VolumeControl.vue'

export interface AudioDemoProps {
  isPlaying: boolean | undefined
  masterGain?: GainNode | null
}

withDefaults(defineProps<AudioDemoProps>(), {
  masterGain: null,
})

const emit = defineEmits<{
  toggle: []
}>()


</script>

<template>
  <div class="audio-demo">
    <div class="start-button-wrapper" v-if="!isPlaying">
      <button @click="emit('toggle')" class="audio-demo-button">
        play
      </button>
    </div>
    <template v-else>
      <div class="volume-controls-wrapper">
        <VolumeControl :gain-node="masterGain" />
      </div>
      <div v-if="$slots.default" class="audio-demo-content">
        <slot />
      </div>
    </template>
  </div>
</template>

<style scoped>
.audio-demo {
  position: relative;
  height: 100%;
  overflow: scroll;
}

.audio-demo-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.start-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  height: 100%;
}

.volume-controls-wrapper {
  position: absolute;
  top: 0;
  left: 0;
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

.audio-demo-content {
  width: 100%;
  padding-top: 24x;
  padding-bottom: 48px;
}
</style>
