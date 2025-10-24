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
  <span><code>audio</code> tag</span>
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
