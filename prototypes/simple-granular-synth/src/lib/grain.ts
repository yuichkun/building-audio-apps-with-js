export class Grain {
  i: number
  baseSpeed: number
  vel: number
  samples: Float32Array
  cursor: number
  grainSize: number
  processedSamples: number
  constructor(i: number) {
    this.i = i
    this.baseSpeed = 0.5
    this.vel = this.calculateVelocity()
    this.samples = new Float32Array()
    this.cursor = 0
    this.grainSize = 0
    this.processedSamples = 0
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
    this.processedSamples = 0
  }

  process() {
    if (!this.samples) return 0

    // Handle boundaries
    if (this.cursor >= this.samples.length || this.cursor < 0) {
      this.init(this.samples, this.grainSize)
    }

    const sample = this.samples[Math.floor(this.cursor)]
    this.cursor += this.vel
    this.processedSamples += this.vel

    return sample
  }

  get hasDied() {
    return this.processedSamples > this.grainSize
  }
}
