<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { onSlideLeave } from '@slidev/client'

export interface SpectrumAnalyzerProps {
  source: AudioNode | null | undefined
  width?: number
  height?: number
  fullscreen?: boolean
  fftSize?: number
  barWidth?: number
  barGap?: number
}

const props = withDefaults(defineProps<SpectrumAnalyzerProps>(), {
  source: null,
  width: 600,
  height: 150,
  fullscreen: false,
  fftSize: 2048,
  barWidth: 3,
  barGap: 1,
})

const canvas = ref<HTMLCanvasElement | null>(null)
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null
let dataArray: Uint8Array<ArrayBuffer> | null = null
const SILENCE_THRESHOLD = 1

function setupAnalyser() {
  cleanup()

  if (!props.source) return

  // Create analyser node
  analyser = props.source.context.createAnalyser()
  analyser.fftSize = props.fftSize
  const bufferLength = analyser.frequencyBinCount
  dataArray = new Uint8Array(bufferLength)

  // Connect source to analyser (analyser is pass-through)
  props.source.connect(analyser)

  // Start animation loop
  draw()
}

function draw() {
  if (!canvas.value || !analyser || !dataArray) return

  animationFrameId = requestAnimationFrame(draw)

  // Get frequency data (unsigned byte array 0-255)
  analyser.getByteFrequencyData(dataArray)

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

  // Check for signal
  let hasSignal = false
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > SILENCE_THRESHOLD) {
      hasSignal = true
      break
    }
  }

  if (!hasSignal) return

  // Draw spectrum bars
  const barTotalWidth = props.barWidth + props.barGap
  const barCount = Math.floor(displayWidth / barTotalWidth)
  const binStep = Math.floor(dataArray.length / barCount)

  for (let i = 0; i < barCount; i++) {
    // Average bins for smoother visualization
    let sum = 0
    for (let j = 0; j < binStep; j++) {
      const index = i * binStep + j
      if (index < dataArray.length) {
        sum += dataArray[index]
      }
    }
    const value = sum / binStep

    // Map value (0-255) to bar height
    const barHeight = (value / 255) * displayHeight
    const x = i * barTotalWidth
    const y = displayHeight - barHeight

    // Create gradient based on height (green to yellow to red)
    const hue = 120 - (value / 255) * 120 // 120 (green) to 0 (red)
    canvasCtx.fillStyle = `hsl(${hue}, 80%, 60%)`
    canvasCtx.fillRect(x, y, props.barWidth, barHeight)
  }
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
  <div class="spectrum-analyzer" :class="{ 'spectrum-analyzer--fullscreen': fullscreen }">
    <canvas ref="canvas" class="spectrum-canvas" :class="{ 'spectrum-canvas--fullscreen': fullscreen }" />
  </div>
</template>

<style scoped>
.spectrum-analyzer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.spectrum-analyzer--fullscreen {
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

.spectrum-canvas {
  border-radius: 0.25rem;
  background: transparent;
  max-width: 100%;
  height: auto;
}

.spectrum-canvas--fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}
</style>
