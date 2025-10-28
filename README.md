# Building Production-Ready Audio Apps with JavaScript

![screenshot](./screenshot.gif)

🎵 **Interactive Demo**: https://building-audio-apps-with-js.vercel.app

Created by [slidev](https://sli.dev/).

## Supported Languages

- 🇬🇧 English
- 🇯🇵 日本語
- 🇨🇳 中文

## Key Takeaways

- 🎵 **Two approaches to audio in the browser**:
  - `HTMLAudioElement` for simple playback
  - Web Audio API for real-time processing and effects
- 🔊 **Web Audio API fundamentals**:
  - Graph-based audio processing system
  - Enables low-latency, real-time audio manipulation
- ⚡ **Overview of AudioWorklet**:
  - Runs audio processing on a dedicated high-priority thread
  - Prevents glitches from main thread blocking
- 🎛️ **AudioWorklet best practices**:
  - Keep `process()` fast (runs every ~3ms at 48kHz)
  - Use MessagePort for parameter updates
  - Avoid memory allocations in the audio thread
- 🌐 **WebAssembly for advanced DSP**:
  - JUCE + Emscripten: Port C++ audio frameworks to the web
  - RNBO: Export Max/MSP patches as web-compatible modules
- 🎹 **Real-world examples**:
  - Custom reverb with AudioWorklet (comb and allpass filters)
  - Convolution reverb
- 🧪 **Experimental demos**:
  - WebGPU-accelerated convolution reverb

## Run Locally

To start the slide show:

- `pnpm install`
- `pnpm dev`
- visit <http://localhost:3030>