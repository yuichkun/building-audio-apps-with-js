/**
 * Schroeder Reverb Implementation
 *
 * Architecture:
 * Input → Pre-delay → [4 Parallel Comb Filters] → 2 Series Allpass Filters → Wet/Dry Mix → Output
 *
 * - Comb filters: Create dense early reflections with feedback
 * - Allpass filters: Add diffusion for smoother reverb tail
 * - Pre-delay: Simulates distance to first reflection
 */

class CombFilter {
  buffer: Float32Array
  writeIndex: number
  delayInSamples: number
  feedback: number

  constructor(delaySamples: number, feedback: number) {
    const initialLength = Math.max(2, Math.ceil(delaySamples))
    this.buffer = new Float32Array(initialLength)
    this.writeIndex = 0
    this.delayInSamples = Math.min(Math.floor(delaySamples), this.buffer.length - 1)
    this.feedback = feedback
  }

  process(input: number): number {
    const readIndex = (this.writeIndex - this.delayInSamples + this.buffer.length) % this.buffer.length
    const delayedSample = this.buffer[readIndex]

    this.buffer[this.writeIndex] = input + delayedSample * this.feedback
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length

    return delayedSample
  }

  updateDelay(newDelaySamples: number) {
    const targetDelay = Math.max(1, Math.floor(newDelaySamples))
    if (targetDelay >= this.buffer.length) {
      const newBuffer = new Float32Array(targetDelay + 1)
      newBuffer.set(this.buffer)
      this.buffer = newBuffer
    }
    this.delayInSamples = Math.min(targetDelay, this.buffer.length - 1)
    this.writeIndex = this.writeIndex % this.buffer.length
  }

  updateFeedback(newFeedback: number) {
    this.feedback = newFeedback
  }
}

class AllpassFilter {
  buffer: Float32Array
  writeIndex: number
  delayInSamples: number
  gain: number

  constructor(delaySamples: number, gain: number = 0.5) {
    const initialLength = Math.max(2, Math.ceil(delaySamples))
    this.buffer = new Float32Array(initialLength)
    this.writeIndex = 0
    this.delayInSamples = Math.min(Math.floor(delaySamples), this.buffer.length - 1)
    this.gain = gain
  }

  process(input: number): number {
    const readIndex = (this.writeIndex - this.delayInSamples + this.buffer.length) % this.buffer.length
    const delayedSample = this.buffer[readIndex]

    const output = -input * this.gain + delayedSample
    this.buffer[this.writeIndex] = input + delayedSample * this.gain
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length

    return output
  }

  updateDelay(newDelaySamples: number) {
    const targetDelay = Math.max(1, Math.floor(newDelaySamples))
    if (targetDelay >= this.buffer.length) {
      const newBuffer = new Float32Array(targetDelay + 1)
      newBuffer.set(this.buffer)
      this.buffer = newBuffer
    }
    this.delayInSamples = Math.min(targetDelay, this.buffer.length - 1)
    this.writeIndex = this.writeIndex % this.buffer.length
  }
}

class ReverbProcessor extends AudioWorkletProcessor {
  combFilters: CombFilter[]
  allpassFilters: AllpassFilter[]
  preDelayBuffer: Float32Array
  preDelayWriteIndex: number
  preDelaySamples: number

  wetDry: number
  decayTime: number
  roomSize: number

  baseCombDelays: number[]
  baseAllpassDelays: number[]

  constructor() {
    super()

    // Base delay times in milliseconds (tuned for natural sound)
    this.baseCombDelays = [29.7, 37.1, 41.1, 43.7] // Prime numbers to avoid resonance
    this.baseAllpassDelays = [5.0, 1.7]

    // Initial parameter values
    this.wetDry = 0.5
    this.decayTime = 2.0 // seconds
    this.roomSize = 1.0
    this.preDelaySamples = 0

    // Initialize filters with base delays
    const baseCombDelaySamples = this.baseCombDelays.map(delayMs => (delayMs / 1000) * sampleRate)
    const feedback = this.calculateFeedback(this.decayTime, baseCombDelaySamples)
    this.combFilters = baseCombDelaySamples.map(delaySamples => new CombFilter(delaySamples, feedback))
    this.allpassFilters = this.baseAllpassDelays.map(
      delayMs => new AllpassFilter((delayMs / 1000) * sampleRate, 0.5)
    )

    // Pre-delay buffer (max 100ms)
    const maxPreDelay = 0.1 * sampleRate
    this.preDelayBuffer = new Float32Array(Math.ceil(maxPreDelay))
    this.preDelayWriteIndex = 0

    // Handle parameter updates
    this.port.onmessage = (e) => {
      if (e.data.wetDry !== undefined) {
        this.wetDry = Math.max(0, Math.min(1, e.data.wetDry))
      }
      if (e.data.decayTime !== undefined) {
        this.decayTime = Math.max(0.1, Math.min(10, e.data.decayTime))
        this.updateDecay()
      }
      if (e.data.preDelay !== undefined) {
        const preDelayMs = Math.max(0, Math.min(100, e.data.preDelay))
        this.preDelaySamples = Math.floor((preDelayMs / 1000) * sampleRate)
      }
      if (e.data.roomSize !== undefined) {
        this.roomSize = Math.max(0.5, Math.min(3, e.data.roomSize))
        this.updateRoomSize()
      }
    }
  }

  calculateFeedback(decayTime: number, delaySamples?: number[]): number {
    // Feedback coefficient to achieve desired RT60 (decay time)
    // RT60 = -60dB decay time
    // feedback = 10^(-3 * delayTime / RT60)
    const samples = delaySamples ?? this.combFilters.map(filter => filter.delayInSamples)
    if (samples.length === 0) return 0
    const avgDelaySamples = samples.reduce((a, b) => a + b, 0) / samples.length
    const avgDelaySec = avgDelaySamples / sampleRate
    return Math.pow(10, (-3 * avgDelaySec) / decayTime)
  }

  updateDecay() {
    const feedback = this.calculateFeedback(this.decayTime)
    this.combFilters.forEach(filter => filter.updateFeedback(feedback))
  }

  updateRoomSize() {
    this.combFilters.forEach((filter, i) => {
      const newDelay = (this.baseCombDelays[i] * this.roomSize / 1000) * sampleRate
      filter.updateDelay(newDelay)
    })
    this.allpassFilters.forEach((filter, i) => {
      const newDelay = (this.baseAllpassDelays[i] * this.roomSize / 1000) * sampleRate
      filter.updateDelay(newDelay)
    })
    this.updateDecay()
  }

  processPreDelay(input: number): number {
    if (this.preDelaySamples === 0) return input

    const readIndex = (this.preDelayWriteIndex - this.preDelaySamples + this.preDelayBuffer.length) % this.preDelayBuffer.length
    const delayed = this.preDelayBuffer[readIndex]

    this.preDelayBuffer[this.preDelayWriteIndex] = input
    this.preDelayWriteIndex = (this.preDelayWriteIndex + 1) % this.preDelayBuffer.length

    return delayed
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0] || !output || !output[0]) return true

    const inputChannel = input[0]
    const leftChannel = output[0]
    const rightChannel = output[1]

    for (let i = 0; i < leftChannel.length; i++) {
      const dry = inputChannel[i]

      // Apply pre-delay
      const preDelayed = this.processPreDelay(dry)

      // Process through parallel comb filters
      let combSum = 0
      for (const filter of this.combFilters) {
        combSum += filter.process(preDelayed)
      }
      combSum /= this.combFilters.length

      // Process through series allpass filters
      let wet = combSum
      for (const filter of this.allpassFilters) {
        wet = filter.process(wet)
      }

      // Wet/dry mix
      const mixed = dry * (1 - this.wetDry) + wet * this.wetDry

      leftChannel[i] = mixed
      if (rightChannel) {
        rightChannel[i] = mixed
      }
    }

    return true
  }
}

registerProcessor('reverb-processor', ReverbProcessor)
