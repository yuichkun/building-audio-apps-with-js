<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioDemo } from '../composables/useAudioDemo'
import AudioDemo from './AudioDemo.vue'
import WaveformVisualizer from './WaveformVisualizer.vue'
// @ts-ignore
import processorUrl from '../lib/reverb-processor.ts?worker&url'

const fileName = ref<string>('')
const isDragging = ref(false)
const wetDry = ref(0)
const decayTime = ref(2.0)
const preDelay = ref(20)
const roomSize = ref(1.0)

let workletNode: AudioWorkletNode | null = null
let sourceNode: AudioBufferSourceNode | null = null
let audioBuffer: AudioBuffer | null = null

const { isPlaying, toggle, masterGain } = useAudioDemo({
  onSetup: (ctx, destination) => {
    ctx.audioWorklet.addModule(processorUrl).then(() => {
      workletNode = new AudioWorkletNode(ctx, 'reverb-processor')
      workletNode.connect(destination)

      // Send initial parameters
      workletNode.port.postMessage({
        wetDry: wetDry.value,
        decayTime: decayTime.value,
        preDelay: preDelay.value,
        roomSize: roomSize.value,
      })
    })
  },
  onCleanup: () => {
    if (sourceNode) {
      sourceNode.stop()
      sourceNode.disconnect()
      sourceNode = null
    }
  }
})

const triggerSound = () => {
  if (!audioBuffer || !workletNode || !isPlaying.value) return

  // Stop previous source if playing
  if (sourceNode) {
    try {
      sourceNode.stop()
      sourceNode.disconnect()
    } catch (e) {
      // Source might already be stopped
    }
  }

  const ctx = workletNode.context as AudioContext
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = audioBuffer
  sourceNode.connect(workletNode)
  sourceNode.start()
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
      await loadAudioFile(file)
    } else {
      alert('Please drop an audio file')
    }
  }
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    loadAudioFile(file)
  }
}

const loadAudioFile = async (file: File) => {
  try {
    fileName.value = file.name
    const arrayBuffer = await file.arrayBuffer()

    // Create temporary context for decoding
    const ctx = new AudioContext()
    audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    ctx.close()
  } catch (error) {
    console.error('Error loading audio file:', error)
    alert('Error loading audio file. Please try a different file.')
  }
}

const onWetDryInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  wetDry.value = value
  if (workletNode) {
    workletNode.port.postMessage({ wetDry: value })
  }
}

const onDecayTimeInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  decayTime.value = value
  if (workletNode) {
    workletNode.port.postMessage({ decayTime: value })
  }
}

const onPreDelayInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  preDelay.value = value
  if (workletNode) {
    workletNode.port.postMessage({ preDelay: value })
  }
}

const onRoomSizeInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  roomSize.value = value
  if (workletNode) {
    workletNode.port.postMessage({ roomSize: value })
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 't' || e.key === 'T') {
    triggerSound()
  }
}

// Load default audio file on mount
onMounted(async () => {
  try {
    const response = await fetch('/sample-snare.wav')
    if (!response.ok) {
      console.warn('Default sample file not found at /sample-snare.wav')
      return
    }
    const arrayBuffer = await response.arrayBuffer()
    const ctx = new AudioContext()
    audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    fileName.value = 'sample-snare.wav'
    ctx.close() // Close temporary context
  } catch (error) {
    console.warn('Could not load default sample file:', error)
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <AudioDemo :is-playing="isPlaying" :master-gain="masterGain" label="Reverb Demo" @toggle="toggle">
    <WaveformVisualizer :source="masterGain" :fullscreen="true" />

    <div class="reverb-container">
      <div class="upper-zone">
        <div class="drop-zone" :class="{ dragging: isDragging }" @dragover="handleDragOver" @dragleave="handleDragLeave"
          k @drop="handleDrop">
          <div class="drop-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <p v-if="!fileName">Drop audio file or click to select</p>
            <p v-else class="file-name">{{ fileName }}</p>
          </div>
          <input type="file" accept="audio/*" @change="handleFileSelect" class="file-input" />
        </div>
        <button @click="triggerSound" class="trigger-button" :disabled="!audioBuffer">
          Trigger Sound ( t )
        </button>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>
            Wet/Dry: {{ (wetDry * 100).toFixed(0) }}%
            <input type="range" min="0" max="1" step="0.01" :value="wetDry" @input="onWetDryInput" />
          </label>
        </div>

        <div class="control-group">
          <label>
            Decay Time: {{ decayTime.toFixed(1) }}s
            <input type="range" min="0.1" max="10" step="0.1" :value="decayTime" @input="onDecayTimeInput" />
          </label>
        </div>
      </div>
    </div>
  </AudioDemo>
</template>

<style scoped>
.reverb-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
}

.upper-zone {
  display: flex;
  gap: 1rem;
}

.drop-zone {
  position: relative;
  width: 300px;
  height: 150px;
  border: 3px dashed #ccc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone.dragging {
  border-color: #4a90e2;
  background-color: rgba(230, 242, 255, 0.8);
  transform: scale(1.02);
}

.drop-zone:hover {
  border-color: #999;
}

.drop-content {
  text-align: center;
  color: #666;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-content svg {
  margin-bottom: 0.5rem;
  color: #999;
}

.drop-content p {
  margin: 0;
  font-size: 0.9rem;
}

.file-name {
  font-weight: 500;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #42b883;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.controls {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trigger-button {
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  color: white;
  border: 1px solid #42b883;
  transition: all 0.2s ease;
  width: 100%;
}

.trigger-button:hover:not(:disabled) {
  background: #cbcbcb22;
}

.trigger-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
  opacity: 0.5;
}

.control-group {
  width: 100%;
}

label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

input[type='range'] {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
