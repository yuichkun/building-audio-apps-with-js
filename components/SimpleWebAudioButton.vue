<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'

let audioBuffer: AudioBuffer | null = null
let filter: BiquadFilterNode | null = null
let sourceNode: AudioBufferSourceNode | null = null
const frequency = ref(10000)
const isBufferPlaying = ref(false)

const { isPlaying, toggle, masterGain } = useAudioDemo({
  onSetup: (ctx, destination) => {
    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = frequency.value
    filter.connect(destination)
  },
  onCleanup: () => {
    if (sourceNode) {
      try {
        sourceNode.stop()
        sourceNode.disconnect()
      } catch (e) {
        // Source might already be stopped
      }
      sourceNode = null
    }
  }
})

const playSound = () => {
  if (!audioBuffer || !filter || !isPlaying.value) return

  // Stop previous source if playing
  if (sourceNode) {
    try {
      sourceNode.stop()
      sourceNode.disconnect()
    } catch (e) {
      // Source might already be stopped
    }
  }

  const ctx = filter.context as AudioContext
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = audioBuffer
  sourceNode.connect(filter)
  sourceNode.start()

  isBufferPlaying.value = true
  sourceNode.onended = () => {
    isBufferPlaying.value = false
  }
}

const updateFrequency = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  frequency.value = value
  if (filter) {
    filter.frequency.value = value
  }
}

onMounted(async () => {
  const response = await fetch('/sample-music.wav')
  const arrayBuffer = await response.arrayBuffer()
  const tempCtx = new AudioContext()
  audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
  tempCtx.close()
})
</script>

<template>
  <AudioDemo :is-playing="isPlaying" :master-gain="masterGain" @toggle="toggle">
    <div class="flex flex-col items-center gap-4">
      Music: <a href="https://open.spotify.com/album/4i1UpRUHk6a6DkiCyjYwbn?si=uRfqlJlnRkiC96SzkgG1Ng" target="_blank"
        rel="noopener noreferrer">
        It's just a... / YOGO
      </a>
      <button
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="isBufferPlaying || !audioBuffer" @click="playSound">
        {{ isBufferPlaying ? 'Playing...' : 'play' }}
      </button>

      <div class="flex flex-col items-center gap-2 w-64">
        <label class="text-sm font-medium">
          Low-Pass Filter: {{ frequency }}Hz
        </label>
        <input type="range" min="100" max="10000" step="10" :value="frequency" @input="updateFrequency"
          class="w-full" />
      </div>
    </div>
  </AudioDemo>
</template>
