class SimpleGranularProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
  }
  static get parameterDescriptors() {
    return [{ name: 'noiseGain', defaultValue: 0.01 }]
  }
  process(inputs, outputs, parameters) {
    // console.log('process:', inputs, outputs, parameters)
    const input = inputs[0]
    const output = outputs[0]
    const inputChannel = input[0]
    const outputChannel = output[0]
    const noiseGain = parameters.noiseGain
    for (let i = 0; i < inputChannel.length; i++) {
      const original = inputChannel[i]
      const noise = Math.random() - 0.5 // -0.5 to 0.5
      const noiseAmp = noiseGain.length === 1 ? noiseGain[0] : noiseGain[i]
      outputChannel[i] = original + noise * noiseAmp
    }
    return true
  }
}

registerProcessor('simple-granular-processor', SimpleGranularProcessor)
