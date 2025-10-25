---
theme: apple-basic
title: Building Production-Ready Audio Apps with JavaScript
drawings:
  persist: false
defaults:
  layout: MyDefault
transition: slide-left
mdc: true
layout: center
class: text-center
background: https://cover.sli.dev
---

# {{ $t('title') }}

<LanguageSwitcher />

---
layout: section
class: text-center
---

# {{ $t('slide2.heading') }}

<LanguageSwitcher />

---
layout: MyDefault
---

# {{ $t('slide3.heading') }}

<div class="h-full grid place-items-center">
  <ol class="list-decimal flex flex-col gap-4 text-4xl">
  <v-clicks>
    <li><code>HTMLAudioElement</code> (<code>HTMLMediaElement</code>)</li>
    <li class="font-bold"> 🚀 Web Audio API</li>
  </v-clicks>
  </ol>
</div>

<LanguageSwitcher />

---
layout: statement
---

# {{ $t('slide4.heading') }}

<LanguageSwitcher />

---
layout: two-cols
---

<h1>Use <code>HTMLAudioElement</code></h1>

{{ $t('slide5.when') }}
<div class="">
  <ul class="flex flex-col gap-4 text-2xl">
  <v-clicks>
    <li>{{ $t('slide5.list1') }}</li>
    <li>{{ $t('slide5.list2') }}</li>
    <li>{{ $t('slide5.list3') }}</li>
  </v-clicks>
  </ul>
</div>

::right::

<div class="mt-[92px] flex flex-col justify-center">
```js
const audio = new Audio('sound.mp3')

audio.play()
```

{{ $t('slide5.or') }}

```html
<audio src="sound.mp3" controls></audio>
```
</div>

<LanguageSwitcher />

---
layout: two-cols
---

<div class="h-full grid place-items-center">

```html
<audio src="sound.mp3" controls></audio>
```

</div>

::right::

<div class="h-full grid place-items-center">
  <audio src="/sample.wav" controls></audio>
</div>

<LanguageSwitcher />

---
layout: two-cols
---

<div class="h-full grid place-items-center">

```vue
<script setup>
const audio = new Audio('/sample.wav')

const playSound = () => {
  audio.play()
}
</script>

<template>
  <button @click="playSound">
    Play Sound
  </button>
</template>
```

</div>

::right::

<div class="h-full grid place-items-center">
  <SimpleAudioButton />
</div>

<LanguageSwitcher />

---
layout: statement
---

# 🎉

<LanguageSwitcher />

---
layout: statement
---

# {{ $t('slide9.heading') }}

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide10.heading') }}

<v-click>
{{ $t('slide10.survey') }}
</v-click>

<LanguageSwitcher />

---
layout: two-cols
---

# Web Audio API

<div class="">
  <ul class="flex flex-col gap-2 text-md">
  <v-clicks>
    <li>{{ $t('slide11.list1') }}</li>
    <li>{{ $t('slide11.list2') }}</li>
    <li>{{ $t('slide11.list3') }}</li>
    <li>{{ $t('slide11.list4') }}</li>
  </v-clicks>
  </ul>
</div>

::right::

<div class="mt-[58px] flex flex-col justify-center">
  <img src="https://web.dev/static/articles/webaudio-intro/image/audio-graph-two-sources-0c11baa2305a4_856.png" />
  <p class="text-xs text-gray-500 mt-2">
    Source: <a href="https://web.dev/articles/webaudio-intro" target="_blank">Getting started with Web Audio API - web.dev</a>
  </p>
</div>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide12.heading') }}

{{ $t('slide12.subtitle') }}

<LanguageSwitcher />

---
layout: two-cols
---

<div class="h-full grid place-items-center">

```js
const ctx = new AudioContext()

const source = ctx.createBufferSource()
source.buffer = audioBuffer

const filter = ctx.createBiquadFilter()
filter.type = 'lowpass'
filter.frequency.value = 1000

source.connect(filter)  // source → filter → destination
filter.connect(ctx.destination)

source.start() // play the source sound
```

</div>

::right::

<div class="h-full grid place-items-center">
  <SimpleWebAudioButton />
</div>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide14.heading') }}

<v-click>
<div class="pt-8">
...<code>AudioWorklet</code> {{ $t('slide14.rescue') }}
</div>
</v-click>

<LanguageSwitcher />

---
layout: two-cols
---

# AudioWorklet

<div class="">
  <ul class="flex flex-col gap-2 text-lg">
  <v-clicks>
    <li>{{ $t('slide15.list1') }}</li>
    <li>{{ $t('slide15.list2') }}</li>
    <li>{{ $t('slide15.list3') }}</li>
    <li>{{ $t('slide15.list4') }}</li>
    <li>{{ $t('slide15.list5') }}</li>
  </v-clicks>
  </ul>
</div>

::right::

<div class="flex flex-col justify-center h-full">
  <img src="https://developer.chrome.com/static/blog/audio-worklet/image/audio-worklet-node-proce-5cdb8f8650c7a.svg" alt="AudioWorklet Architecture" class="w-full" />
  <p class="text-xs text-gray-500 mt-2">
    Source: <a href="https://developer.chrome.com/blog/audio-worklet" target="_blank">Enter AudioWorklet - Chrome Developers</a>
  </p>
</div>

<LanguageSwitcher />

---
layout: center
---

{{ $t('slide16.heading') }}

<div class="text-sm text-gray-500 mt-4">
{{ $t('slide16.basedOn') }} <a href="https://developer.chrome.com/blog/audio-worklet" target="_blank">Enter AudioWorklet - Chrome Developers</a>
</div>

<LanguageSwitcher />

---
layout: two-cols
---

<div class="px-2">

**{{ $t('slide17.mainThread') }}** ({{ $t('slide17.yourApp') }})

```js
// Load the processor module
await ctx.audioWorklet.addModule('gain-processor.js')

// Create the worklet node
const gainNode = new AudioWorkletNode(
  ctx,
  'gain-processor'
)

// Connect it to the audio graph
oscillator
  .connect(gainNode)
  .connect(ctx.destination)
```

</div>

::right::

<div class="px-2">

**{{ $t('slide17.audioThread') }}** ({{ $t('slide17.processor') }})

```js
// gain-processor.js
class GainProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'gain', defaultValue: 1 }]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0]
    const output = outputs[0][0]
    const gain = parameters.gain[0]

    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] * gain
    }

    return true // Keep processor alive
  }
}

registerProcessor('gain-processor', GainProcessor)
```

</div>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide18.heading') }}

<LanguageSwitcher />

---
layout: MyDefault
---

<ReverbDemo />

<LanguageSwitcher />
---
layout: two-cols
---

<div class="px-2" style="--slidev-code-font-size: 8px; --slidev-code-line-height: 8px;">

**{{ $t('slide20.mainThread') }}**

```js
// Load the reverb processor
await ctx.audioWorklet.addModule(
  'reverb-processor.js'
)

// Create the worklet node
const reverbNode = new AudioWorkletNode(
  ctx, 'reverb-processor'
)
reverbNode.connect(ctx.destination)

// Send parameters via MessagePort
reverbNode.port.postMessage({
  wetDry: 0.5,
  decayTime: 2.0,
})

// Route audio through reverb
const source = ctx.createBufferSource()
source.buffer = audioBuffer
source.connect(reverbNode)
source.start()
```

</div>

::right::

<div class="px-2" style="--slidev-code-font-size: 8px; --slidev-code-line-height: 8px;">

**{{ $t('slide20.audioThread') }}**

```js
// reverb-processor.js
class ReverbProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    // Initialize comb & allpass filters
    this.combFilters = [...]
    this.allpassFilters = [...]

    // Listen for parameter updates
    this.port.onmessage = (e) => {
      this.wetDry = e.data.wetDry
      this.decayTime = e.data.decayTime
      // Update filters...
    }
  }

  process(inputs, outputs, params) {
    const dry = inputs[0][0]

    // Apply reverb filters
    let wet = this.processFilters(dry)

    // Mix wet/dry
    outputs[0][0] = dry * (1 - this.wetDry)
                  + wet * this.wetDry
    return true
  }
}

registerProcessor('reverb-processor', ReverbProcessor)
```

</div>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide21.heading') }}

<div class="text-left">
  <ul class="flex flex-col gap-4 text-xl">
  <v-clicks>
    <li>{{ $t('slide21.list1') }} <code>process()</code> {{ $t('slide21.list1b') }} <strong>{{ $t('slide21.list1c') }}</strong> {{ $t('slide21.list1d') }}</li>
    <li>{{ $t('slide21.list2') }} <strong>{{ $t('slide21.list2b') }}</strong> {{ $t('slide21.list2c') }}</li>
    <li>{{ $t('slide21.list3') }} <strong>{{ $t('slide21.list3b') }}</strong></li>
  </v-clicks>
  </ul>
</div>

<div class="text-sm text-gray-500 mt-8">
{{ $t('slide21.source') }} <a href="https://developer.chrome.com/blog/audio-worklet-design-pattern" target="_blank">AudioWorklet Design Pattern - Chrome Developers</a>
</div>

<LanguageSwitcher />

---
layout: MyDefault
---

# {{ $t('slide22.heading') }}

<div class="text-sm text-gray-500 mb-3">
{{ $t('slide22.description') }}
</div>

```js

  artificialDelay(durationMs: number) {
    if (durationMs <= 0) return

    const startTime = Date.now()
    const endTime = startTime + durationMs

    // Busy-wait until the desired duration has passed
    while (Date.now() < endTime) {
      // Intentionally empty - burning CPU cycles
    }
  }
```

<LanguageSwitcher />

---
layout: MyDefault
---


<DelayGlitchDemo />

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide24.heading') }}

<v-click>
<div class="pt-8">
{{ $t('slide24.answer') }}
</div>
</v-click>

<LanguageSwitcher />

---
layout: MyDefault
---

# {{ $t('slide25.heading') }}

**{{ $t('slide25.whyWasm') }}**

<v-clicks>

- ⚡ {{ $t('slide25.list1') }}
- ♻️ {{ $t('slide25.list2') }}

</v-clicks>

<v-click>

**{{ $t('slide25.popularOptions') }}**

</v-click>

<v-clicks>

- 🎹 [JUCE + Emscripten](https://github.com/Dreamtonics/juce_emscripten) - {{ $t('slide25.juceDesc') }}
- 🎛️ [RNBO](https://rnbo.cycling74.com/) - {{ $t('slide25.rnboDesc') }}

</v-clicks>

<LanguageSwitcher />

---
layout: image-right
image: /juce.png
---

# {{ $t('slide26.heading') }}

<v-clicks>

- 🛠️ {{ $t('slide26.list1') }}
- 🎛️ {{ $t('slide26.list2') }}
- 📱 {{ $t('slide26.list3') }}
- 🔌 {{ $t('slide26.list4') }}

</v-clicks>

<LanguageSwitcher />

---
layout: MyDefault
---

# {{ $t('slide27.heading') }}


<div class="mt-8">

[juce_emscripten](https://github.com/Dreamtonics/juce_emscripten) {{ $t('slide27.description') }}

<a href="https://synthesizerv.com/lab/wasm-juce-demorunner/DemoRunner.html" target="_blank" class="text-xl">
🎮 {{ $t('slide27.tryDemo') }}
</a>
</div>

<LanguageSwitcher />

---
layout: image-right
image: /max.png
---

# {{ $t('slide28.heading') }}

<v-clicks>

- 🎼 {{ $t('slide28.list1') }}
- 🏢 {{ $t('slide28.list2') }}
- 🔌 {{ $t('slide28.list3') }}
- 🎹 {{ $t('slide28.list4') }}
- 🌐 **{{ $t('slide28.list5') }}**

</v-clicks>

<LanguageSwitcher />

---
layout: image-right
image: /kentaro.jpg
---

# {{ $t('slide29.heading') }}

<div class="text-center mt-8">
  <p class="text-xl text-gray-400 mb-8">
    {{ $t('slide29.collaboration') }} <a href="https://kentaro.tools/" target="_blank" class="">kentaro</a>, <br /> {{ $t('slide29.soundDesigner') }}
  </p>
  <a href="https://kentaro-granular-web.vercel.app/" target="_blank" class="text-2xl">
    🌐 {{ $t('slide29.tryDemo') }}
  </a>
</div>

<LanguageSwitcher />

---
layout: image-right
image: /single-motion-granular.gif
---

# single motion granular

**{{ $t('slide30.howWeBuilt') }}**

<v-clicks>

- 🎛️ {{ $t('slide30.list1') }}
- ⚙️ {{ $t('slide30.list2') }}
- 🎨 {{ $t('slide30.list3') }}
- 🔌 {{ $t('slide30.list4') }}
- ⚡ **{{ $t('slide30.list5') }}**

</v-clicks>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('slide31.heading') }}

<v-click>
{{ $t('slide31.description') }}
</v-click>

<LanguageSwitcher />

---
layout: MyDefault
---

# {{ $t('slide32.heading') }}

<div class="text-sm mb-4">

**{{ $t('slide32.convolution') }}** = {{ $t('slide32.convolutionDesc') }}

<v-clicks>

- **{{ $t('slide32.cpuImpl') }}**: {{ $t('slide32.cpuImplDesc') }}
- **{{ $t('slide32.gpuImpl') }}**: {{ $t('slide32.gpuImplDesc') }}

</v-clicks>

</div>

<ConvolutionReverbDemo />

<LanguageSwitcher />

---
layout: statement
---

# {{ $t('slide33.heading') }}

<LanguageSwitcher />

---
layout: image-right
image: /portrait.jpg
---

# {{ $t('slide34.heading') }}
<v-clicks>

- 🎓 {{ $t('slide34.list1') }}
- 🏢 {{ $t('slide34.list2') }} [Escentier, LLC](https://www.escentier.com).
- {{ $t('slide34.weDeliver') }}
  - 🎥 {{ $t('slide34.video') }}
  - ✨ {{ $t('slide34.graphics') }}
  - 🎵 {{ $t('slide34.music') }}
  - 💻 {{ $t('slide34.webApps') }}

</v-clicks>


<LanguageSwitcher />
---
layout: statement
---

# {{ $t('slide35.heading') }}

<LanguageSwitcher />

---
layout: image-left
image: /anthony.jpg
---

# {{ $t('slide36.heading') }}

<v-clicks>

**Anthony Fu** - {{ $t('slide36.anthony') }} [Slidev](https://sli.dev/)

{{ $t('slide36.powered') }} [Slidev](https://sli.dev/) - {{ $t('slide36.slidevDesc') }}

[antfu.me](https://antfu.me/)
</v-clicks>

<LanguageSwitcher />
