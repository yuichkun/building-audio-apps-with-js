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

  constructor() {
    super()

    // Initialize sine wave generator at 220Hz
    this.phase = 0
    const frequency = 220 // A3 note
    this.phaseIncrement = (2 * Math.PI * frequency) / sampleRate

    // Processing delay in milliseconds
    this.delayMs = 0

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

    // Introduce artificial delay BEFORE processing
    this.artificialDelay(this.delayMs)

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

    return true
  }
}

registerProcessor('delay-glitch-processor', DelayGlitchProcessor)
