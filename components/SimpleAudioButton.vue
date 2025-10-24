<script setup lang="ts">
import { ref } from 'vue'

const audio = new Audio('/sample.wav')
const isPlaying = ref(false)

const playSound = async () => {
  if (isPlaying.value) return

  isPlaying.value = true
  audio.currentTime = 0
  await audio.play()

  audio.onended = () => {
    isPlaying.value = false
  }
}
</script>

<template>
  <button
    class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    :disabled="isPlaying" @click="playSound">
    {{ isPlaying ? 'Playing...' : 'Play Sound' }}
  </button>
</template>
