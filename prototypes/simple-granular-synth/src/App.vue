<script setup lang="ts">
import { ref } from 'vue'
import processorUrl from './lib/simple-granular-processor.js?worker&url'

const fileName = ref<string>('')
const isDragging = ref(false)
const grainSize = ref(2000) // samples
const numGrains = ref(8)
const playbackSpeed = ref(0.5)

let context: AudioContext | null = null
let granularNode: AudioWorkletNode | null = null

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
    fileName.value = file.name

    // Initialize audio context on first drop
    if (!context) {
      context = new AudioContext()
      await context.audioWorklet.addModule(processorUrl)
    }

    // Create new granular node
    granularNode = new AudioWorkletNode(context, 'simple-granular-processor')
    granularNode.connect(context.destination)

    // Load and decode audio file
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(arrayBuffer)
    const channelData = audioBuffer.getChannelData(0) // Float32Array
    const buffer = channelData.buffer

    // Send initial parameters
    granularNode.port.postMessage({
      buffer,
      grainSize: grainSize.value,
      numGrains: numGrains.value,
      playbackSpeed: playbackSpeed.value,
    })
  } catch (error) {
    console.error('Error loading audio file:', error)
    alert('Error loading audio file. Please try a different file.')
  }
}

const onGrainSizeInput = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value)
  grainSize.value = value
  if (granularNode) {
    granularNode.port.postMessage({ grainSize: value })
  }
}

const onNumGrainsInput = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value)
  numGrains.value = value
  if (granularNode) {
    granularNode.port.postMessage({ numGrains: value })
  }
}

const onPlaybackSpeedInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  playbackSpeed.value = value
  if (granularNode) {
    granularNode.port.postMessage({ playbackSpeed: value })
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

    <div v-if="fileName" class="controls">
      <div class="control-group">
        <label>
          Grain Size: {{ Math.round(grainSize / 44.1) }}ms
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            :value="grainSize"
            @input="onGrainSizeInput"
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          Number of Grains: {{ numGrains }}
          <input
            type="range"
            min="1"
            max="32"
            step="1"
            :value="numGrains"
            @input="onNumGrainsInput"
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          Playback Speed: {{ playbackSpeed.toFixed(2) }}x
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            :value="playbackSpeed"
            @input="onPlaybackSpeedInput"
          />
        </label>
      </div>
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

.controls {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  margin-top: 2em;
}

.control-group {
  width: 100%;
}
</style>
