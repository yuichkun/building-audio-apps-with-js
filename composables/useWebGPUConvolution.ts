import { ref, onUnmounted } from 'vue'
import { onSlideLeave } from '@slidev/client'

const BLOCK_SIZE = 2048
const MAX_IR_SEC = 3.0

// WGSL compute shader for convolution
const WGSL_SHADER = /* wgsl */ `
struct Params {
  irLen : u32,
  prevLen : u32,
  blockSize : u32,
};

@group(0) @binding(0) var<storage, read> extIn : array<f32>;        // length = prevLen + block
@group(0) @binding(1) var<storage, read> ir : array<f32>;           // length = irLen
@group(0) @binding(2) var<storage, read_write> outBuf : array<f32>; // length = block
@group(0) @binding(3) var<uniform> P : Params;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.blockSize) { return; }
  var acc : f32 = 0.0;
  let base = P.prevLen + i;
  for (var k:u32 = 0u; k < P.irLen; k = k + 1u) {
    acc = acc + extIn[base - k] * ir[k];
  }
  outBuf[i] = acc;
}
`

export type IRPreset = 'room' | 'hall' | 'plate' | 'box'

export interface UseWebGPUConvolutionReturn {
  isSupported: Readonly<ReturnType<typeof ref<boolean>>>
  isReady: Readonly<ReturnType<typeof ref<boolean>>>
  error: Readonly<ReturnType<typeof ref<string | null>>>
  irLength: Readonly<ReturnType<typeof ref<number>>>
  irDuration: Readonly<ReturnType<typeof ref<number>>>
  initializeGPU: () => Promise<void>
  setIR: (preset: IRPreset, sampleRate: number) => void
  processBlock: (inputBlock: Float32Array, prevTail: Float32Array) => Promise<Float32Array>
  cleanup: () => void
}

/**
 * Composable for WebGPU-accelerated convolution reverb processing.
 * Manages GPU device, compute pipeline, impulse response generation, and block processing.
 */
export function useWebGPUConvolution(): UseWebGPUConvolutionReturn {
  const isSupported = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)
  const irLength = ref(0)
  const irDuration = ref(0)

  let device: GPUDevice | null = null
  let queue: GPUCommandQueue | null = null
  let pipeline: GPUComputePipeline | null = null

  // GPU buffers
  let extGPU: GPUBuffer | null = null
  let irGPU: GPUBuffer | null = null
  let outGPU: GPUBuffer | null = null
  let paramGPU: GPUBuffer | null = null
  let bindGroup: GPUBindGroup | null = null

  // IR data
  let irData: Float32Array | null = null

  /**
   * Generate procedural impulse response based on preset type
   */
  function makeIR(kind: IRPreset, sampleRate: number): Float32Array {
    const sec =
      kind === 'room' ? 0.6 :
      kind === 'hall' ? 2.2 :
      kind === 'plate' ? 1.2 :
      kind === 'box' ? 0.35 : 1.0

    const N = Math.min(Math.floor(sec * sampleRate), Math.floor(MAX_IR_SEC * sampleRate))
    const out = new Float32Array(N)

    // Early reflections (discrete impulses)
    const early = (idx: number, gain: number) => {
      if (idx >= 0 && idx < N) out[idx] += gain
    }

    if (kind === 'room') {
      early(Math.floor(0.004 * sampleRate), 0.6)
      early(Math.floor(0.009 * sampleRate), 0.4)
      early(Math.floor(0.013 * sampleRate), 0.3)
    } else if (kind === 'hall') {
      early(Math.floor(0.010 * sampleRate), 0.5)
      early(Math.floor(0.021 * sampleRate), 0.35)
      early(Math.floor(0.035 * sampleRate), 0.25)
    } else if (kind === 'plate') {
      early(Math.floor(0.002 * sampleRate), 0.7)
      early(Math.floor(0.006 * sampleRate), 0.5)
    } else if (kind === 'box') {
      early(Math.floor(0.0015 * sampleRate), 0.8)
      early(Math.floor(0.0032 * sampleRate), 0.6)
      early(Math.floor(0.0050 * sampleRate), 0.45)
    }

    // Decay time constant
    const tau =
      kind === 'room' ? 0.25 :
      kind === 'hall' ? 0.9 :
      kind === 'plate' ? 0.45 :
      kind === 'box' ? 0.12 : 0.3

    // Frequency-dependent tone shaping
    const tone = (k: number) => {
      const f = k / N
      if (kind === 'plate') return 0.6 + 0.8 * f
      if (kind === 'box') return 0.9 - 0.5 * Math.abs(f - 0.4)
      if (kind === 'hall') return 0.8 + 0.2 * f
      return 1.0
    }

    // Generate exponentially decaying noise tail
    let a1 = 0
    let a2 = 0
    for (let i = 0; i < N; i++) {
      const t = i / sampleRate
      const env = Math.exp(-t / tau)
      const n = (Math.random() * 2 - 1) * 0.6
      // Simple 2-pole lowpass filter for smoother noise
      a1 = a1 * 0.97 + n * 0.03
      a2 = a2 * 0.9 + a1 * 0.1
      out[i] += a2 * env * tone(i)
    }

    // Normalize to prevent clipping
    let peak = 1e-9
    for (let i = 0; i < N; i++) {
      peak = Math.max(peak, Math.abs(out[i]))
    }
    const g = 1 / peak
    for (let i = 0; i < N; i++) {
      out[i] *= g
    }

    return out
  }

  /**
   * Initialize WebGPU device and create compute pipeline
   */
  async function initializeGPU(): Promise<void> {
    try {
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported in this browser')
      }

      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) {
        throw new Error('No GPU adapter available')
      }

      device = await adapter.requestDevice()
      queue = device.queue

      // Create compute pipeline
      const module = device.createShaderModule({ code: WGSL_SHADER })
      pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
          module,
          entryPoint: 'main',
        },
      })

      isSupported.value = true
      isReady.value = true
      error.value = null
    } catch (err) {
      isSupported.value = false
      isReady.value = false
      error.value = err instanceof Error ? err.message : 'Unknown GPU initialization error'
      console.error('WebGPU initialization failed:', err)
    }
  }

  /**
   * Set impulse response and allocate GPU resources
   */
  function setIR(preset: IRPreset, sampleRate: number): void {
    if (!device || !queue || !pipeline) {
      console.error('GPU not initialized')
      return
    }

    // Generate IR
    irData = makeIR(preset, sampleRate)
    irLength.value = irData.length
    irDuration.value = irData.length / sampleRate

    const prevLen = Math.max(0, irData.length - 1)
    const extLen = prevLen + BLOCK_SIZE

    // Clean up old buffers
    cleanupGPUBuffers()

    // Create new GPU buffers
    const createBuffer = (size: number, usage: GPUBufferUsageFlags) => {
      return device!.createBuffer({
        size: size * 4, // Float32 = 4 bytes
        usage,
        mappedAtCreation: false,
      })
    }

    extGPU = createBuffer(extLen, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    irGPU = createBuffer(irData.length, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    outGPU = createBuffer(BLOCK_SIZE, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC)

    // Create uniform buffer for parameters
    const paramArr = new Uint32Array([irData.length, prevLen, BLOCK_SIZE])
    paramGPU = device.createBuffer({
      size: 12, // 3 * uint32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    queue.writeBuffer(paramGPU, 0, paramArr.buffer)

    // Create bind group
    bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: extGPU } },
        { binding: 1, resource: { buffer: irGPU } },
        { binding: 2, resource: { buffer: outGPU } },
        { binding: 3, resource: { buffer: paramGPU } },
      ],
    })

    // Upload IR to GPU
    queue.writeBuffer(irGPU, 0, irData.buffer)
  }

  /**
   * Process one block of audio through GPU convolution
   */
  async function processBlock(
    inputBlock: Float32Array,
    prevTail: Float32Array
  ): Promise<Float32Array> {
    if (!device || !queue || !pipeline || !bindGroup || !extGPU || !outGPU) {
      throw new Error('GPU resources not initialized')
    }

    // Concatenate previous tail + current input
    const prevLen = prevTail.length
    const ext = new Float32Array(prevLen + inputBlock.length)
    if (prevLen > 0) {
      ext.set(prevTail, 0)
    }
    ext.set(inputBlock, prevLen)

    // Upload extended input to GPU
    queue.writeBuffer(extGPU, 0, ext.buffer)

    // Create command encoder and compute pass
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(BLOCK_SIZE / 128))
    pass.end()

    // Create staging buffer for reading results
    const readBuf = device.createBuffer({
      size: BLOCK_SIZE * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })
    encoder.copyBufferToBuffer(outGPU, 0, readBuf, 0, BLOCK_SIZE * 4)

    // Submit and read results
    queue.submit([encoder.finish()])
    await readBuf.mapAsync(GPUMapMode.READ)
    const out = new Float32Array(readBuf.getMappedRange().slice(0))
    readBuf.unmap()

    return out
  }

  /**
   * Clean up GPU buffers
   */
  function cleanupGPUBuffers(): void {
    extGPU?.destroy()
    irGPU?.destroy()
    outGPU?.destroy()
    paramGPU?.destroy()

    extGPU = null
    irGPU = null
    outGPU = null
    paramGPU = null
    bindGroup = null
  }

  /**
   * Clean up all GPU resources
   */
  function cleanup(): void {
    cleanupGPUBuffers()

    device?.destroy()
    device = null
    queue = null
    pipeline = null
    irData = null

    isReady.value = false
  }

  // Cleanup on slide leave and unmount
  onSlideLeave(() => {
    cleanup()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isSupported,
    isReady,
    error,
    irLength,
    irDuration,
    initializeGPU,
    setIR,
    processBlock,
    cleanup,
  }
}
