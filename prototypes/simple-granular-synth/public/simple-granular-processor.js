class SimpleGranularProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.port.onmessage = (e) => {
      const samples = new Float32Array(e.data.buffer)
      this.samples = samples
      this.grains.forEach((grain) => grain.init(this.samples, this.grainSize))
    }

    this.numOfGrains = 8
    this.grainSize = 2000 // ~45ms at 44.1kHz
    this.grains = Array(this.numOfGrains)
      .fill()
      .map((i) => new Grain(i))
  }
  static get parameterDescriptors() {
    return [{ name: 'noiseGain', defaultValue: 0.1 }]
  }
  process(inputs, outputs, parameters) {
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
  constructor(i) {
    this.i = i
    this.vel = 0.2 + Math.random() * 0.6 // 0.2 to 0.8 speed
  }

  init(samples, grainSize) {
    this.samples = samples
    this.cursor = Math.floor(Math.random() * this.samples.length)
    this.grainSize = grainSize
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
