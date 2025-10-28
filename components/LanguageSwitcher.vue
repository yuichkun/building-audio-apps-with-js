<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isOpen = ref(false)
const buttonRef = ref<HTMLElement>()

// Calculate dropdown position based on button location
const dropdownStyle = computed(() => {
  if (!buttonRef.value) return {}
  const rect = buttonRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.right - 120}px`, // Align to right edge (120px = min-width)
  }
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const switchLanguage = (lang: string) => {
  locale.value = lang
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.language-switcher') && !target.closest('.dropdown-menu')) {
    isOpen.value = false
  }
}

// Add/remove click listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="language-switcher" @click.stop>
    <!-- Globe button with Lucide icon -->
    <button ref="buttonRef" @click="toggleDropdown" class="globe-button" :class="{ active: isOpen }">
      <div class="i-lucide-globe h-5 w-5" />
    </button>

    <!-- Teleport dropdown to body to escape overflow constraints -->
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-menu" :style="dropdownStyle" @click.stop>
        <button @click="switchLanguage('en')" class="menu-item" :class="{ selected: locale === 'en' }">
          🇬🇧 English
          <div v-if="locale === 'en'" class="i-lucide-check h-4 w-4 check-icon" />
        </button>
        <button @click="switchLanguage('ja')" class="menu-item" :class="{ selected: locale === 'ja' }">
          🇯🇵 日本語
          <div v-if="locale === 'ja'" class="i-lucide-check h-4 w-4 check-icon" />
        </button>
        <button @click="switchLanguage('zh-cn')" class="menu-item" :class="{ selected: locale === 'zh-cn' }">
          🇨🇳 简体中文
          <div v-if="locale === 'zh-cn'" class="i-lucide-check h-4 w-4 check-icon" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Container */
.language-switcher {
  position: fixed;
  top: 0px;
  right: 0px;
  z-index: 1000;
  background: transparent;
}

/* Globe button - shadcn-like style */
.globe-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.globe-button .i-lucide-globe {
  color: #6b7280;
}

.globe-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.globe-button:hover .i-lucide-globe {
  color: #4b5563;
}

.globe-button.active {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.globe-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* Dropdown menu - positioned via JavaScript */
.dropdown-menu {
  position: fixed; /* Changed from absolute to escape overflow */
  z-index: 9999; /* High z-index to ensure visibility */
  min-width: 120px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: slideIn 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Menu items - styled for better appearance */
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s ease;
  text-align: left;
  font-family: system-ui, -apple-system, sans-serif;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.selected {
  font-weight: 500;
  background: #f0f9ff;
  color: #0369a1;
}

.check-icon {
  color: #10b981;
  flex-shrink: 0;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .dropdown-menu {
    min-width: 140px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .globe-button {
    background: #1f2937;
    border-color: #374151;
  }

  .globe-button .i-lucide-globe {
    color: #9ca3af;
  }

  .globe-button:hover {
    background: #374151;
    border-color: #4b5563;
  }

  .globe-button:hover .i-lucide-globe {
    color: #d1d5db;
  }

  .globe-button.active {
    background: #111827;
    border-color: #4b5563;
  }

  .dropdown-menu {
    background: #1f2937;
    border-color: #374151;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  }

  .menu-item {
    color: #e5e7eb;
  }

  .menu-item:hover {
    background: #374151;
  }

  .menu-item.selected {
    background: #1e3a8a;
    color: #93c5fd;
  }
}
</style>