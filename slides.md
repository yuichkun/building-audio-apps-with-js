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

# Making Sound on Web

---
layout: MyDefault
---

# 2 ways to make sound on web

<div class="h-full grid place-items-center">
  <ol class="list-decimal flex flex-col gap-4 text-4xl">
  <v-clicks>
    <li><code>HTMLAudioElement</code> (<code>HTMLMediaElement</code>)</li>
    <li class="font-bold"> 🚀 Web Audio API</li>
  </v-clicks>
  </ol>
</div>

---
layout: statement
---

# Which one to choose? 🤔

---
layout: two-cols
---

<h1>Use <code>HTMLAudioElement</code></h1>

when...
<div class="">
  <ul class="flex flex-col gap-4 text-2xl">
  <v-clicks>
    <li>you just want to play a sound file</li>
    <li>you don't need fine-grained control over loading</li>
    <li>you only need to play it as-is</li>
  </v-clicks>
  </ul>
</div>

::right::

<div class="mt-[92px] flex flex-col justify-center">
```js
const audio = new Audio('sound.mp3')

audio.play()
```

or

```html
<audio src="sound.mp3" controls></audio>
```
</div>

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

---
layout: statement
---

# 🎉

---
layout: statement
---

# ...not happy?

---
layout: center
---

# Welcome to the world of Web Audio API 🤝

<v-click>
Quick survey: Who have ever used Web Audio API before?
</v-click>

---
layout: two-cols
---

# Web Audio API

<div class="">
  <ul class="flex flex-col gap-2 text-md">
  <v-clicks>
    <li>High-level JavaScript API for audio processing</li>
    <li>Node-based audio routing graph architecture</li>
    <li>Runs on a separate high-priority audio thread</li>
    <li>Built-in audio nodes for common tasks (gain, filters, oscillators, etc.)</li>
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

---
layout: center
---

# Simple playback using Web Audio API

with low-pass filter
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

---
layout: center
---

# 👁️ When built-in nodes don't satisfy your needs...

<v-click>
<div class="pt-8">
...<code>AudioWorklet</code> to the rescue! 🧑‍🚒
</div>
</v-click>

---
layout: two-cols
---

# AudioWorklet

<div class="">
  <ul class="flex flex-col gap-2 text-lg">
  <v-clicks>
    <li>Enables custom audio processing on the audio rendering thread</li>
    <li>Runs on audio thread (not main thread) = no glitches</li>
    <li>Two-part architecture: Processor + Node</li>
    <li>Must load processor module via <code>addModule()</code></li>
    <li>Use MessagePort for bidirectional communication</li>
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

---
layout: center
---

Code Example: Building a GainProcessor

<div class="text-sm text-gray-500 mt-4">
Based on example from <a href="https://developer.chrome.com/blog/audio-worklet" target="_blank">Enter AudioWorklet - Chrome Developers</a>
</div>

---
layout: two-cols
---

<div class="px-2">

**Main Thread** (your app)

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

**Audio Thread** (processor)

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

---
layout: MyDefault
---

# Simple Reverb Demo

<ReverbDemo />

<LanguageSwitcher />

---
layout: image-right
image: /portrait.jpg
---

# Who am I?
<v-clicks>

- 🎓 Studied composition at Tokyo University of the Arts
- 🏢 Founder and creative lead at [Escentier, LLC](https://www.escentier.com).
- We deliver:
  - 🎥 Video production
  - ✨ 3D graphics
  - 🎵 Tailored music and sound design
  - 💻 Web apps, games, and other digital experiences

</v-clicks>


<LanguageSwitcher />
---
layout: statement
---

# Lastly...

---
layout: image-left
image: /anthony.jpg
---

# Special Thanks

<v-clicks>

**Anthony Fu** - a friend from bouldering 🧗 and creator of [Slidev](https://sli.dev/)

This presentation is powered by [Slidev](https://sli.dev/) - the only tool that makes sounds and i18n in slides possible!

[antfu.me](https://antfu.me/)
</v-clicks>
