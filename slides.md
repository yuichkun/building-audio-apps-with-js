---
theme: seriph
background: https://cover.sli.dev
title: Building Production-Ready Audio Apps with JavaScript
info: |
  ## Audio Apps with JavaScript
  Real-time audio processing in the browser for Vue Fes 2025
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# {{ $t('title') }}

{{ $t('subtitle') }}

<div class="pt-12">
  <span class="px-2 py-1 rounded cursor-pointer opacity-80">
    {{ $t('presenter') }}
  </span>
</div>

<LanguageSwitcher />

---
layout: center
class: text-center
---

# {{ $t('intro.title') }}

{{ $t('intro.content') }}

<LanguageSwitcher />

---

# {{ $t('problem.title') }}

<div class="text-xl opacity-80 mb-8">{{ $t('problem.subtitle') }}</div>

<v-clicks>

- 🚀 {{ $t('problem.point1') }}
- ⚡ {{ $t('problem.point2') }}
- 🎯 {{ $t('problem.point3') }}
- 💻 {{ $t('problem.point4') }}

</v-clicks>

<LanguageSwitcher />

---

# {{ $t('webAudio.title') }}

<div class="text-xl opacity-80 mb-6">{{ $t('webAudio.subtitle') }}</div>

{{ $t('webAudio.intro') }}

<div class="mt-8">

### {{ $t('webAudio.features.title') }}

<v-clicks>

- 🧩 {{ $t('webAudio.features.modularity') }}
- ⏱️ {{ $t('webAudio.features.realtime') }}
- 🔀 {{ $t('webAudio.features.routing') }}
- 🎛️ {{ $t('webAudio.features.effects') }}

</v-clicks>

</div>

<LanguageSwitcher />

---
layout: two-cols
---

# {{ $t('worklets.title') }}

<div class="text-lg opacity-80 mb-4">{{ $t('worklets.subtitle') }}</div>

**{{ $t('worklets.what') }}**

<v-click>

### {{ $t('worklets.why') }}

</v-click>

::right::

<v-click>

<div class="mt-16">

```javascript
// AudioWorklet example
class MyProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0]
    const input = inputs[0]

    for (let channel = 0; channel < output.length; ++channel) {
      for (let i = 0; i < output[channel].length; ++i) {
        output[channel][i] = input[channel][i] * 0.5
      }
    }

    return true
  }
}
```

</div>

</v-click>

<LanguageSwitcher />

---

# {{ $t('architecture.title') }}

<div class="text-xl opacity-80 mb-8">{{ $t('architecture.subtitle') }}</div>

<v-clicks>

1. **{{ $t('architecture.layer1') }}**
2. **{{ $t('architecture.layer2') }}**
3. **{{ $t('architecture.layer3') }}**
4. **{{ $t('architecture.layer4') }}**

</v-clicks>

<LanguageSwitcher />

---

# {{ $t('challenges.title') }}

<v-clicks>

- 🗑️ **{{ $t('challenges.gc') }}**
- 📉 **{{ $t('challenges.buffer') }}**
- 🔄 **{{ $t('challenges.sync') }}**
- 📱 **{{ $t('challenges.mobile') }}**

</v-clicks>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('solutions.title') }}

<v-clicks>

- ✅ {{ $t('solutions.preallocate') }}
- ♻️ {{ $t('solutions.pooling') }}
- 👷 {{ $t('solutions.workers') }}
- 📲 {{ $t('solutions.progressive') }}

</v-clicks>

<LanguageSwitcher />

---

# {{ $t('demo.title') }}

<div class="text-xl opacity-80 mb-6">{{ $t('demo.subtitle') }}</div>

<v-clicks>

1. {{ $t('demo.step1') }}
2. {{ $t('demo.step2') }}
3. {{ $t('demo.step3') }}
4. {{ $t('demo.step4') }}

</v-clicks>

<div class="mt-8">

```vue
<script setup>
import { ref, onMounted } from 'vue'

const audioContext = ref(null)

onMounted(async () => {
  audioContext.value = new AudioContext()
  await audioContext.value.audioWorklet.addModule('processor.js')
  // ... connect nodes
})
</script>
```

</div>

<LanguageSwitcher />

---
layout: center
---

# {{ $t('conclusion.title') }}

<v-clicks>

- 🎵 {{ $t('conclusion.point1') }}
- 🚫 {{ $t('conclusion.point2') }}
- 📊 {{ $t('conclusion.point3') }}
- 🧪 {{ $t('conclusion.point4') }}

</v-clicks>

<LanguageSwitcher />

---
layout: center
class: text-center
---

# {{ $t('thanks.title') }}

<div class="text-2xl mt-8">
  {{ $t('thanks.questions') }}
</div>

<div class="mt-4 opacity-60">
  {{ $t('thanks.contact') }}
</div>

<LanguageSwitcher />
