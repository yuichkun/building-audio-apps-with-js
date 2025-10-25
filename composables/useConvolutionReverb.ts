import { ref, onUnmounted } from 'vue'
import { onSlideLeave } from '@slidev/client'
import { useWebGPUConvolution, type IRPreset } from './useWebGPUConvolution'

const BLOCK_SIZE = 2048
const WORKLET_NAME = 'gpu-convolver-processor'

export interface UseConvolutionReverbReturn {
  isPlaying: Readonly<ReturnType<typeof ref<boolean>>>
  isLoading: Readonly<ReturnType<typeof ref<boolean>>>
  wetMix: Readonly<ReturnType<typeof ref<number>>>
  volume: Readonly<ReturnType<typeof ref<number>>>
  audioReady: Readonly<ReturnType<typeof ref<boolean>>>
  irPreset: Readonly<ReturnType<typeof ref<IRPreset>>>
  outputNode: Readonly<ReturnType<typeof ref<GainNode | null>>>
  statusMessage: Readonly<ReturnType<typeof ref<string>>>
  loadAudioFile: (url: string) => Promise<void>
  trigger: () => void
  setWetMix: (value: number) => void
  setVolume: (value: number) => void
  setIRPreset: (preset: IRPreset) => void
}

/**
 * Composable for convolution reverb audio processing.
 * Integrates AudioWorklet with WebGPU processing for real-time convolution.
 */
export function useConvolutionReverb(): UseConvolutionReverbReturn {
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const wetMix = ref(0.5)
  const volume = ref(0.5) // Master volume control
  const audioReady = ref(false)
  const irPreset = ref<IRPreset>('room')
  const outputNode = ref<GainNode | null>(null)
  const statusMessage = ref('Initializing...')

  const gpu = useWebGPUConvolution()

  let ctx: AudioContext | null = null
  let workletNode: AudioWorkletNode | null = null
  let sourceNode: AudioBufferSourceNode | null = null
  let audioBuffer: AudioBuffer | null = null

  // Audio graph nodes
  let wetGain: GainNode | null = null
  let dryGain: GainNode | null = null
  let dryDelay: DelayNode | null = null
  let splitter: ChannelSplitterNode | null = null
  let gL: GainNode | null = null
  let gR: GainNode | null = null
  let drySum: GainNode | null = null
  let masterOut: GainNode | null = null
  let limiter: DynamicsCompressorNode | null = null

  // GPU processing state
  let prevTail: Float32Array | null = null
  let pendingGPU = false
  let pendingInBlock: Float32Array | null = null

  // Track if audio graph is connected
  let audioGraphConnected = false

  /**
   * Create AudioWorklet processor code inline
   */
  function createWorkletCode(): string {
    return `
class GPUConvolverProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.BLOCK = ${BLOCK_SIZE};
    this.inputBuf = new Float32Array(this.BLOCK);
    this.inputFill = 0;
    this.outputQueue = [];
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m?.type === 'outBlock') {
        this.outputQueue.push(m.data);
      } else if (m?.type === 'reset') {
        // Clear all state on reset
        this.inputFill = 0;
        this.inputBuf.fill(0);
        this.outputQueue.length = 0;
      }
    };
  }

  static get parameterDescriptors() {
    return [];
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    const chL = input[0] || new Float32Array(128);
    const chR = input[1] || null;

    // Accumulate 128-frame chunks into ${BLOCK_SIZE}-frame blocks
    // Convert stereo to mono: -6dB summing
    const n = chL.length || 128;
    for (let i = 0; i < n; i++) {
      const l = chL[i] || 0;
      const r = chR ? chR[i] : 0;
      this.inputBuf[this.inputFill++] = (l + r) * 0.5;
    }

    // When block is full, send to main thread for GPU processing
    if (this.inputFill >= this.BLOCK) {
      const block = this.inputBuf.slice(0, this.BLOCK);
      this.port.postMessage({ type: 'inBlock', data: block }, [block.buffer]);
      this.inputFill = 0;
    }

    // Output GPU-processed blocks (wet signal only)
    const outL = output[0];
    const have = this.outputQueue.length ? this.outputQueue[0] : null;
    if (have && have.length >= n) {
      const chunk = have.subarray(0, n);
      // Hard clip to prevent any possibility of clipping
      for (let i = 0; i < chunk.length; i++) {
        outL[i] = Math.max(-0.95, Math.min(0.95, chunk[i]));
      }
      if (have.length === n) {
        this.outputQueue.shift();
      } else {
        const rest = have.subarray(n);
        const copy = new Float32Array(rest.length);
        copy.set(rest);
        this.outputQueue[0] = copy;
      }
    } else {
      outL.fill(0);
    }

    return true;
  }
}

registerProcessor('${WORKLET_NAME}', GPUConvolverProcessor);
`
  }

  /**
   * Initialize AudioContext and audio graph
   */
  async function initAudioContext(): Promise<void> {
    if (ctx) return

    ctx = new AudioContext()

    // Create worklet node
    const workletCode = createWorkletCode()
    const blob = new Blob([workletCode], { type: 'application/javascript' })
    const workletURL = URL.createObjectURL(blob)

    await ctx.audioWorklet.addModule(workletURL)
    URL.revokeObjectURL(workletURL)

    workletNode = new AudioWorkletNode(ctx, WORKLET_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1], // mono wet output
    })

    // Create audio graph nodes
    wetGain = ctx.createGain()
    dryGain = ctx.createGain()
    dryDelay = ctx.createDelay(1.0)
    dryDelay.delayTime.value = BLOCK_SIZE / ctx.sampleRate // Compensate for GPU latency

    // Dry signal: stereo to mono conversion
    splitter = ctx.createChannelSplitter(2)
    gL = ctx.createGain()
    gL.gain.value = 0.5
    gR = ctx.createGain()
    gR.gain.value = 0.5
    drySum = ctx.createGain()

    // Master output (for visualization)
    masterOut = ctx.createGain()
    masterOut.gain.value = volume.value // Set initial volume without boost

    // Brick wall limiter to prevent clipping
    limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -6 // Start limiting at -6dB
    limiter.knee.value = 0 // Hard knee for brick wall limiting
    limiter.ratio.value = 100 // Very high ratio for brick wall limiting (100:1)
    limiter.attack.value = 0.0001 // Very fast attack (0.1ms)
    limiter.release.value = 0.01 // Fast release (10ms)

    outputNode.value = masterOut

    // Set initial wet/dry mix
    updateWetDryMix(wetMix.value)

    // Setup GPU processing message handler
    setupGPUProcessing()

    // Initialize GPU and IR
    if (!gpu.isReady.value) {
      await gpu.initializeGPU()
    }

    if (gpu.isSupported.value) {
      gpu.setIR(irPreset.value, ctx.sampleRate)
      prevTail = new Float32Array(Math.max(0, (gpu.irLength.value || 0) - 1))
    }

    statusMessage.value = 'Audio system initialized'
  }

  /**
   * Setup GPU processing message loop
   */
  function setupGPUProcessing(): void {
    if (!workletNode) return

    workletNode.port.addEventListener('message', async (e) => {
      const msg = e.data
      if (msg?.type === 'inBlock') {
        pendingInBlock = msg.data
        if (!pendingGPU && isPlaying.value) {
          runOneGPU()
        }
      }
    })
    workletNode.port.start()
  }

  /**
   * Process one block through GPU and return result to worklet
   */
  async function runOneGPU(): Promise<void> {
    if (!pendingInBlock || pendingGPU || !isPlaying.value || !workletNode || !prevTail) {
      return
    }

    pendingGPU = true

    try {
      // Process block through GPU
      const out = await gpu.processBlock(pendingInBlock, prevTail)

      // Send processed block back to worklet
      workletNode.port.postMessage({ type: 'outBlock', data: out }, [out.buffer])

      // Update prevTail for next block
      const prevLen = prevTail.length
      if (prevLen > 0) {
        const ext = new Float32Array(prevLen + pendingInBlock.length)
        ext.set(prevTail, 0)
        ext.set(pendingInBlock, prevLen)
        prevTail.set(ext.subarray(ext.length - prevLen))
      }
    } catch (err) {
      console.error('GPU processing error:', err)
      statusMessage.value = 'GPU processing error'
    }

    pendingInBlock = null
    pendingGPU = false

    // Continue processing if more blocks are pending
    if (isPlaying.value && pendingInBlock) {
      runOneGPU()
    }
  }

  /**
   * Update wet/dry mix using equal-power crossfade
   */
  function updateWetDryMix(value: number): void {
    if (!wetGain || !dryGain) return

    // Equal-power crossfade for more natural mixing
    // Using cosine curves to maintain perceived loudness
    const angle = value * Math.PI / 2
    wetGain.gain.value = Math.sin(angle) * 0.4 // Scale down wet signal to prevent clipping
    dryGain.gain.value = Math.cos(angle)

    // Set master volume without boost
    if (masterOut) {
      masterOut.gain.value = volume.value
    }
  }

  /**
   * Load audio file from URL
   */
  async function loadAudioFile(url: string): Promise<void> {
    isLoading.value = true
    statusMessage.value = 'Loading audio file...'

    try {
      await initAudioContext()

      if (!ctx) {
        throw new Error('AudioContext not initialized')
      }

      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      audioReady.value = true
      statusMessage.value = `Audio loaded: ${(audioBuffer.duration).toFixed(1)}s, ${audioBuffer.sampleRate}Hz`
    } catch (err) {
      console.error('Failed to load audio:', err)
      statusMessage.value = 'Failed to load audio file'
      audioReady.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Trigger one-shot playback
   */
  function trigger(): void {
    if (!ctx || !audioBuffer || !workletNode || !wetGain || !dryGain || !drySum || !dryDelay || !splitter || !gL || !gR || !masterOut || !limiter) {
      console.error('Audio system not ready')
      return
    }

    // Resume context if suspended
    if (ctx.state !== 'running') {
      ctx.resume()
    }

    // Stop previous source if playing
    const wasPlaying = isPlaying.value
    if (sourceNode) {
      try {
        // Clear onended handler to prevent race condition
        // The old source's onended would set isPlaying=false after the new source starts
        sourceNode.onended = null
        sourceNode.stop()
        sourceNode.disconnect()
      } catch (e) {
        // Already stopped
      }
    }

    // Clear worklet state on re-trigger
    if (workletNode && wasPlaying) {
      workletNode.port.postMessage({ type: 'reset' })
    }

    // Reset GPU processing state
    pendingInBlock = null
    pendingGPU = false

    // Only reset prevTail when starting from a completely stopped state
    // Preserve reverb tail during re-triggers for continuity
    if (!wasPlaying) {
      prevTail = new Float32Array(Math.max(0, (gpu.irLength.value || 0) - 1))
    }
    dryDelay.delayTime.value = BLOCK_SIZE / ctx.sampleRate

    // Create new source (BufferSourceNode can only be started once)
    sourceNode = ctx.createBufferSource()
    sourceNode.buffer = audioBuffer
    sourceNode.loop = false // One-shot playback

    // Setup audio graph if not already connected
    if (!audioGraphConnected) {
      // Wet path: source → worklet → wetGain → masterOut → limiter → destination
      workletNode.connect(wetGain)
      wetGain.connect(masterOut)
      masterOut.connect(limiter!)
      limiter!.connect(ctx.destination)

      // Dry path connections (static part)
      splitter.connect(gL, 0)
      splitter.connect(gR, 1)
      gL.connect(drySum)
      gR.connect(drySum)
      drySum.connect(dryDelay)
      dryDelay.connect(dryGain)
      dryGain.connect(masterOut)

      audioGraphConnected = true
    }

    // Connect source to both paths
    sourceNode.connect(workletNode)
    sourceNode.connect(splitter)

    // Handle playback end
    sourceNode.onended = () => {
      isPlaying.value = false
      statusMessage.value = 'Ready'
    }

    sourceNode.start()
    isPlaying.value = true
    statusMessage.value = `Playing (${(BLOCK_SIZE / ctx.sampleRate * 1000).toFixed(0)}ms latency)`
  }

  /**
   * Set wet/dry mix value
   */
  function setWetMix(value: number): void {
    wetMix.value = Math.max(0, Math.min(1, value))
    updateWetDryMix(wetMix.value)
  }

  /**
   * Set master volume
   */
  function setVolume(value: number): void {
    volume.value = Math.max(0, Math.min(1, value))
    if (masterOut) {
      masterOut.gain.value = volume.value // Set volume without boost
    }
  }

  /**
   * Set IR preset
   */
  function setIRPreset(preset: IRPreset): void {
    irPreset.value = preset

    if (ctx && gpu.isSupported.value) {
      gpu.setIR(preset, ctx.sampleRate)
      prevTail = new Float32Array(Math.max(0, (gpu.irLength.value || 0) - 1))
      statusMessage.value = `IR: ${preset} (${(gpu.irDuration.value || 0).toFixed(3)}s)`
    }
  }

  /**
   * Cleanup all audio resources
   */
  function cleanup(): void {
    // Stop any playing source
    if (sourceNode) {
      try {
        sourceNode.stop()
        sourceNode.disconnect()
      } catch (e) {
        // Already stopped
      }
      sourceNode = null
    }

    if (ctx) {
      ctx.close()
      ctx = null
    }

    workletNode = null
    audioBuffer = null
    wetGain = null
    dryGain = null
    dryDelay = null
    splitter = null
    gL = null
    gR = null
    drySum = null
    masterOut = null
    limiter = null
    outputNode.value = null
    prevTail = null
    pendingInBlock = null
    pendingGPU = false
    audioGraphConnected = false

    audioReady.value = false
    isPlaying.value = false
  }

  // Cleanup on slide leave and unmount
  onSlideLeave(() => {
    cleanup()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isPlaying,
    isLoading,
    wetMix,
    volume,
    audioReady,
    irPreset,
    outputNode,
    statusMessage,
    loadAudioFile,
    trigger,
    setWetMix,
    setVolume,
    setIRPreset,
  }
}
