class SimpleGranularProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.port.onmessage = (e) => {
      const samples = new Float32Array(e.data.buffer)
      this.samples = samples
    }
    this.cursor = 0
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
      if (this.cursor >= this.samples.length) {
        this.cursor = 0 // loop back to start
      }

      const sample = this.samples[Math.floor(this.cursor)]
      leftChannel[i] = sample
      if (rightChannel) {
        rightChannel[i] = sample
      }

      this.cursor += 2.3
    }

    return true
  }
}

registerProcessor('simple-granular-processor', SimpleGranularProcessor)
