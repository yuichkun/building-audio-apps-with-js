import { Grain } from './grain'

class SimpleGranularProcessor extends AudioWorkletProcessor {
  numOfGrains: number
  grainSize: number
  playbackSpeed: number
  grains: Grain[]
  samples: Float32Array | null
  constructor() {
    super()
    this.numOfGrains = 8
    this.grainSize = 2000 // ~45ms at 44.1kHz
    this.playbackSpeed = 0.5
    this.grains = Array(this.numOfGrains)
      .fill(null)
      .map((i) => new Grain(i))
    this.samples = null

    this.port.onmessage = (e) => {
      if (e.data.buffer) {
        const samples = new Float32Array(e.data.buffer)
        this.samples = samples
        this.grains.forEach((grain) => grain.init(samples, this.grainSize, this.playbackSpeed))
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
    if (this.samples === null) return
    this.numOfGrains = newNum
    this.grains = Array(newNum)
      .fill(null)
      .map((i) => new Grain(i))
    if (this.samples) {
      this.grains.forEach((grain) => grain.init(this.samples!, this.grainSize, this.playbackSpeed))
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

    for (let sampleIndex = 0; sampleIndex < leftChannel.length; sampleIndex++) {
      // Remove dead grains and replenish immediately
      this.grains = this.grains.filter((grain) => !grain.hasDied)
      this.replenishGrains()

      for (const grain of this.grains) {
        const sample = grain.process() / Math.sqrt(this.numOfGrains)
        leftChannel[sampleIndex] += sample
        if (rightChannel) {
          rightChannel[sampleIndex] += sample
        }
      }
    }

    return true
  }
  replenishGrains() {
    if (!this.samples) return
    while (this.grains.length < this.numOfGrains) {
      const newGrain = new Grain(this.grains.length)
      newGrain.init(this.samples, this.grainSize, this.playbackSpeed)
      this.grains.push(newGrain)
    }
  }
}

registerProcessor('simple-granular-processor', SimpleGranularProcessor)
