class SimpleGranularProcessor extends AudioWorkletProcessor {
  numOfGrains: number
  grainSize: number
  playbackSpeed: number
  grains: Grain[]
  samples: Float32Array
  constructor() {
    super()
    this.numOfGrains = 8
    this.grainSize = 2000 // ~45ms at 44.1kHz
    this.playbackSpeed = 0.5
    this.grains = Array(this.numOfGrains)
      .fill(null)
      .map((i) => new Grain(i))
    this.samples = new Float32Array()

    this.port.onmessage = (e) => {
      if (e.data.buffer) {
        const samples = new Float32Array(e.data.buffer)
        this.samples = samples
        this.grains.forEach((grain) => grain.init(this.samples, this.grainSize, this.playbackSpeed))
      }
      if (e.data.numGrains !== undefined) {
        this.updateNumGrains(e.data.numGrains)
      }
      if (e.data.grainSize !== undefined) {
        this.grainSize = e.data.grainSize
        this.grains.forEach((grain) => (grain.grainSize = this.grainSize))
      }
      if (e.data.playbackSpeed !== undefined) {
        this.playbackSpeed = e.data.playbackSpeed
        this.grains.forEach((grain) => grain.updateSpeed(this.playbackSpeed))
      }
    }
  }

  updateNumGrains(newNum: number) {
    if (newNum === this.numOfGrains) return
    this.numOfGrains = newNum
    this.grains = Array(this.numOfGrains)
      .fill(null)
      .map((i) => new Grain(i))
    if (this.samples) {
      this.grains.forEach((grain) => grain.init(this.samples, this.grainSize, this.playbackSpeed))
    }
  }
  static get parameterDescriptors() {
    return [{ name: 'noiseGain', defaultValue: 0.1 }]
  }
  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>,
  ): boolean {
    const output = outputs[0]
    if (!output || !output[0] || !this.samples) return true

    const leftChannel = output[0]
    const rightChannel = output[1]

    for (let i = 0; i < leftChannel.length; i++) {
      leftChannel[i] = 0
      if (rightChannel) rightChannel[i] = 0

      for (let grainIndex = 0; grainIndex < this.numOfGrains; grainIndex++) {
        const grain = this.grains[grainIndex]
        const sample = grain.process() / this.numOfGrains
        leftChannel[i] += sample
        if (rightChannel) {
          rightChannel[i] += sample
        }
      }
    }

    return true
  }
}

class Grain {
  i: number
  baseSpeed: number
  vel: number
  samples: Float32Array
  cursor: number
  grainSize: number
  constructor(i: number) {
    this.i = i
    this.baseSpeed = 0.5
    this.vel = this.calculateVelocity()
    this.samples = new Float32Array()
    this.cursor = 0
    this.grainSize = 0
  }

  calculateVelocity() {
    // Add some random variation around base speed
    const variation = 0.2
    return this.baseSpeed * (1 - variation + Math.random() * variation * 2)
  }

  updateSpeed(newSpeed: number) {
    this.baseSpeed = newSpeed
    this.vel = this.calculateVelocity()
  }

  init(samples: Float32Array, grainSize: number, playbackSpeed?: number) {
    this.samples = samples
    this.cursor = Math.floor(Math.random() * this.samples.length)
    this.grainSize = grainSize
    this.baseSpeed = playbackSpeed ?? 0.5
    this.vel = this.calculateVelocity()
  }

  process() {
    if (!this.samples) return 0

    // Handle boundaries
    if (this.cursor >= this.samples.length || this.cursor < 0) {
      this.init(this.samples, this.grainSize)
    }

    const sample = this.samples[Math.floor(this.cursor)]
    this.cursor += this.vel

    return sample
  }
}

registerProcessor('simple-granular-processor', SimpleGranularProcessor)
