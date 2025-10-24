/**
 * Delay Glitch Processor
 *
 * Generates a 220Hz sine wave and introduces artificial processing delays
 * to demonstrate audio glitches when exceeding the 3ms budget.
 */

class DelayGlitchProcessor extends AudioWorkletProcessor {
  phase: number
  phaseIncrement: number
  delayMs: number
  frameCounter: number
  reportInterval: number

  constructor() {
    super()

    // Initialize sine wave generator at 220Hz
    this.phase = 0
    const frequency = 220 // A3 note
    this.phaseIncrement = (2 * Math.PI * frequency) / sampleRate

    // Processing delay in milliseconds
    this.delayMs = 0

    // Throttling for sending timing updates
    this.frameCounter = 0
    this.reportInterval = 10 // Send timing update every 10 frames

    // Handle parameter updates from main thread
    this.port.onmessage = (e) => {
      if (e.data.delayMs !== undefined) {
        this.delayMs = Math.max(0, Math.min(10, e.data.delayMs))
      }
    }
  }

  /**
   * Busy-wait loop to artificially delay processing
   * Note: Uses Date.now() since performance is not available in AudioWorkletGlobalScope
   */
  artificialDelay(durationMs: number) {
    if (durationMs <= 0) return

    const startTime = Date.now()
    const endTime = startTime + durationMs

    // Busy-wait until the desired duration has passed
    while (Date.now() < endTime) {
      // Intentionally empty - burning CPU cycles
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0]
    if (!output || !output[0]) return true

    const leftChannel = output[0]
    const rightChannel = output[1]

    // Measure actual execution time
    const startTime = Date.now()

    // Introduce artificial delay INTERMITTENTLY (50% of frames)
    // This creates glitchy/stuttering sound instead of complete silence
    if (Math.random() < 0.5) {
      this.artificialDelay(this.delayMs)
    }

    // Generate sine wave for each sample
    for (let i = 0; i < leftChannel.length; i++) {
      const sample = Math.sin(this.phase) * 0.3 // 0.3 amplitude for safety

      leftChannel[i] = sample
      if (rightChannel) {
        rightChannel[i] = sample
      }

      // Advance phase
      this.phase += this.phaseIncrement
      if (this.phase >= 2 * Math.PI) {
        this.phase -= 2 * Math.PI
      }
    }

    const endTime = Date.now()
    const actualTimeMs = endTime - startTime

    // Send timing update to main thread (throttled)
    this.frameCounter++
    if (this.frameCounter >= this.reportInterval) {
      this.port.postMessage({ actualTimeMs })
      this.frameCounter = 0
    }

    return true
  }
}

registerProcessor('delay-glitch-processor', DelayGlitchProcessor)
