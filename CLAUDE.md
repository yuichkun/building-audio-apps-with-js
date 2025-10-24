# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slidev presentation for Vue Fes 2025 on "Building Production-Ready Audio Apps with JavaScript". Demonstrates Web Audio API integration with Vue 3 using composables and components.

## Commands

Uses pnpm as package manager:

```bash
pnpm install          # Install dependencies
pnpm build            # Build static presentation
pnpm export           # Export to PDF
```

Note: `pnpm dev` starts the dev server but should be run by the user, not automated tools.

## Architecture

### Audio System Design

The project uses a layered composable architecture for Web Audio API:

**Base Layer: `useAudioContext`** (composables/useAudioContext.ts)
- Manages AudioContext lifecycle per component instance
- Enforces user-gesture requirement for audio playback
- Auto-stops audio when slide becomes inactive via `onSlideLeave`
- Each component gets isolated AudioContext to prevent interference

**High-Level Layer: `useAudioDemo`** (composables/useAudioDemo.ts)
- Wrapper around `useAudioContext` for creating audio demos
- Creates master gain node (defaults to -60dB for safety)
- Accepts `onSetup` callback receiving (ctx, destination) - connect to destination, not ctx.destination
- Handles automatic node cleanup and disconnection
- Optional `onCleanup` callback for custom teardown logic

**Component Layer: `AudioDemo.vue`**
- Reusable UI wrapper for audio demonstrations
- Integrates with `useAudioDemo` composables
- Includes VolumeControl component for master gain adjustment
- Provides consistent play/stop interface

### Key Patterns

1. **Safety First**: Master gain defaults to -60dB (silent) to prevent unexpected loud audio
2. **Isolation**: Each component instance has its own AudioContext to avoid state conflicts
3. **Automatic Cleanup**: Audio stops when navigating away from slides or component unmounts
4. **User Gesture**: Audio playback requires explicit user interaction (button click)

### I18n Setup

- Configured in `setup/main.ts` using vue-i18n Composition API mode
- Translation files in `locales/` (en.json, ja.json)
- Integrated with Slidev's app setup system

## File Structure

- `slides.md` - Main presentation content (Slidev markdown format)
- `components/` - Vue components (audio demos, UI controls, visualizers)
- `composables/` - Reusable Vue composables (audio context management)
- `setup/` - Slidev setup files (i18n configuration)
- `locales/` - i18n translation files
- `prototypes/` - Experimental code and standalone demos
