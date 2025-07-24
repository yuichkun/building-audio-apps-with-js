<script setup lang="ts">
import { ref } from 'vue'

const noiseGain = ref(0.01)
const fileName = ref<string>('')
const isDragging = ref(false)

let granularNode: AudioWorkletNode | null = null
let context: AudioContext | null = null
let sourceNode: AudioBufferSourceNode | null = null

const onNoiseGainInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  noiseGain.value = value
  if (granularNode && context) {
    granularNode.parameters.get('noiseGain')?.setValueAtTime(value, context.currentTime)
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('audio/')) {
      await loadAndPlayAudioFile(file)
    } else {
      alert('Please drop an audio file')
    }
  }
}

const loadAndPlayAudioFile = async (file: File) => {
  try {
    // Stop current playback if any
    if (sourceNode) {
      sourceNode.stop()
      sourceNode = null
    }

    // Initialize audio context on first drop
    if (!context) {
      context = new AudioContext()
      await context.audioWorklet.addModule('simple-granular-processor.js')
      granularNode = new AudioWorkletNode(context, 'simple-granular-processor')
      granularNode.connect(context.destination)
    }

    // Load and decode audio file
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(arrayBuffer)
    fileName.value = file.name

    // Create and play source
    sourceNode = context.createBufferSource()
    sourceNode.buffer = audioBuffer
    sourceNode.loop = true
    sourceNode.connect(granularNode!)
    sourceNode.start()
  } catch (error) {
    console.error('Error loading audio file:', error)
    alert('Error loading audio file. Please try a different file.')
  }
}
</script>

<template>
  <div class="container">
    <div
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="drop-content">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <p v-if="!fileName">Drop an audio file here</p>
        <p v-else class="file-name">{{ fileName }}</p>
      </div>
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

.drop-zone {
  width: 400px;
  height: 250px;
  border: 3px dashed #ccc;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: #fafafa;
}

.drop-zone.dragging {
  border-color: #4a90e2;
  background-color: #e6f2ff;
  transform: scale(1.02);
}

.drop-content {
  text-align: center;
  color: #666;
}

.drop-content svg {
  margin-bottom: 1em;
  color: #999;
}

.file-name {
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #4caf50;
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
