<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { onSlideLeave } from '@slidev/client'

export interface WaveformVisualizerProps {
  source: AudioNode | null | undefined
  width?: number
  height?: number
  fullscreen?: boolean
}

const props = withDefaults(defineProps<WaveformVisualizerProps>(), {
  source: null,
  width: 600,
  height: 150,
  fullscreen: false,
})

const canvas = ref<HTMLCanvasElement | null>(null)
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null
let dataArray: Float32Array<ArrayBuffer> | null = null
const SILENCE_THRESHOLD = 0.0005

function setupAnalyser() {
  cleanup()

  if (!props.source) return

  // Create analyser node
  analyser = props.source.context.createAnalyser()
  analyser.fftSize = 2048
  const bufferLength = analyser.fftSize  // Use fftSize for time-domain data, not frequencyBinCount
  dataArray = new Float32Array(bufferLength)

  // Connect source to analyser (analyser is pass-through)
  props.source.connect(analyser)

  // Start animation loop
  draw()
}

function draw() {
  if (!canvas.value || !analyser || !dataArray) return

  animationFrameId = requestAnimationFrame(draw)

  // Get time domain data (float for smooth waveform)
  analyser.getFloatTimeDomainData(dataArray)

  const canvasCtx = canvas.value.getContext('2d')
  if (!canvasCtx) return

  // Get display dimensions (accounting for fullscreen mode)
  const displayWidth = props.fullscreen ? window.innerWidth : props.width
  const displayHeight = props.fullscreen ? window.innerHeight : props.height

  // Account for device pixel ratio for crisp rendering
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = displayWidth * dpr
  canvas.value.height = displayHeight * dpr
  canvasCtx.scale(dpr, dpr)

  // Clear canvas
  canvasCtx.fillStyle = 'rgb(18, 18, 18)'
  canvasCtx.fillRect(0, 0, displayWidth, displayHeight)

  let hasSignal = false
  for (let i = 0; i < dataArray.length; i++) {
    if (Math.abs(dataArray[i]) > SILENCE_THRESHOLD) {
      hasSignal = true
      break
    }
  }

  if (!hasSignal) return

  // Draw waveform
  canvasCtx.lineWidth = 2
  canvasCtx.strokeStyle = 'rgb(200, 200, 200)'
  canvasCtx.beginPath()

  const sliceWidth = displayWidth / dataArray.length
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i]  // Float data: -1.0 to 1.0
    const y = ((v + 1) * displayHeight) / 2  // Map -1..1 to 0..height

    if (i === 0) {
      canvasCtx.moveTo(x, y)
    } else {
      canvasCtx.lineTo(x, y)
    }

    x += sliceWidth
  }

  canvasCtx.lineTo(displayWidth, displayHeight / 2)
  canvasCtx.stroke()
}

function cleanup() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (analyser) {
    analyser.disconnect()
    analyser = null
  }

  dataArray = null
}

// Watch for source changes
watch(() => props.source, (newSource) => {
  if (newSource) {
    setupAnalyser()
  } else {
    cleanup()
  }
})

// Setup on mount if source already exists
onMounted(() => {
  if (props.source) {
    setupAnalyser()
  }
})

// Cleanup on slide leave and unmount
onSlideLeave(() => {
  cleanup()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="waveform-visualizer" :class="{ 'waveform-visualizer--fullscreen': fullscreen }">
    <canvas ref="canvas" class="waveform-canvas" :class="{ 'waveform-canvas--fullscreen': fullscreen }" />
  </div>
</template>

<style scoped>
.waveform-visualizer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.waveform-visualizer--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100%;
  z-index: -1;
  padding: 0;
  margin: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-canvas {
  border-radius: 0.25rem;
  background: transparent;
  max-width: 100%;
  height: auto;
}

.waveform-canvas--fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}
</style>
