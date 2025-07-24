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
    if (!input || !output) return true
    const leftInputCh = input[0]
    const leftOutputCh = output[0]
    const rightOutputCh = output[1]
    if (!leftInputCh || !leftOutputCh) return true
    const noiseGain = parameters.noiseGain
    for (let i = 0; i < leftInputCh.length; i++) {
      const original = leftInputCh[i]
      const noise = Math.random() - 0.5 // -0.5 to 0.5
      const noiseAmp = noiseGain.length === 1 ? noiseGain[0] : noiseGain[i]
      const sample = original + noise * noiseAmp
      // mono write
      leftOutputCh[i] = sample
      rightOutputCh[i] = sample
    }
    return true
  }
}

registerProcessor('simple-granular-processor', SimpleGranularProcessor)
