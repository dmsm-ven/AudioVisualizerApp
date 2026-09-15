<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import type ButterchurnModule from 'butterchurn'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { useButterchurnSettings } from '../composables/useButterchurnSettings'
import { useVisualizerSelection } from '../composables/useVisualizerSelection'
import { buildFilterCss } from '../composables/useCanvasFilters'
import { createGlassRainEffect } from '../visualizers/glassRain'

const { getAnalyser, getAudioContext } = useAudioPlayer()
const {
  presetKeys: presetKeysShared,
  isRandomOrder,
  presetCycleSeconds,
  selectedPresetKey,
  currentPresetKey,
} = useButterchurnSettings()
const { selectedVisualizer } = useVisualizerSelection()

const stageRef = ref<HTMLElement | null>(null)
const butterchurnCanvasRef = ref<HTMLCanvasElement | null>(null)
const customCanvasRef = ref<HTMLCanvasElement | null>(null)

const CUSTOM_PRESET_NAME = 'painven - glass rain 1'

/* ---------- Общее ---------- */

let animationFrameId = 0
let resizeObserver: ResizeObserver | null = null

function resizeCanvases() {
  const stage = stageRef.value
  if (!stage) return
  const width = stage.clientWidth
  const height = stage.clientHeight

  const bcCanvas = butterchurnCanvasRef.value
  if (bcCanvas) {
    bcCanvas.width = width
    bcCanvas.height = height
    visualizer?.setRendererSize(width, height)
  }

  const customCanvas = customCanvasRef.value
  if (customCanvas) {
    customCanvas.width = width
    customCanvas.height = height
  }
}

// Применение выбранных CSS-фильтров к активному canvas (свойство `filter`)
watchEffect(() => {
  const css = buildFilterCss()
  if (butterchurnCanvasRef.value) butterchurnCanvasRef.value.style.filter = css
  if (customCanvasRef.value) customCanvasRef.value.style.filter = css
})

/* ---------- Butterchurn (MilkDrop) ---------- */

type Visualizer = ReturnType<typeof ButterchurnModule.createVisualizer>

let butterchurn: typeof ButterchurnModule | null = null
let visualizer: Visualizer | null = null
let connectedNode: AudioNode | null = null
let presetCycleInterval: ReturnType<typeof setInterval> | null = null
let isLoadingLibrary = false
let initFailed = false

const PRESET_BLEND_SECONDS = 2.7

let presetKeys: string[] = []
let presetsMap: Record<string, unknown> = {}

function loadPresetByKey(key: string) {
  if (!visualizer || !presetsMap[key]) return
  visualizer.loadPreset(presetsMap[key], PRESET_BLEND_SECONDS)
  currentPresetKey.value = key
}

function pickRandomPreset() {
  if (!visualizer || presetKeys.length === 0) return
  const key = presetKeys[Math.floor(Math.random() * presetKeys.length)]
  if (key) {
    loadPresetByKey(key)
  }
}

function startRandomCycle() {
  stopRandomCycle()
  pickRandomPreset()
  presetCycleInterval = setInterval(pickRandomPreset, presetCycleSeconds.value * 1000)
}

function stopRandomCycle() {
  if (presetCycleInterval) {
    clearInterval(presetCycleInterval)
    presetCycleInterval = null
  }
}

watch(isRandomOrder, (random) => {
  if (!visualizer) return
  if (random) {
    startRandomCycle()
  } else {
    stopRandomCycle()
    if (selectedPresetKey.value) {
      loadPresetByKey(selectedPresetKey.value)
    }
  }
})

watch(selectedPresetKey, (key) => {
  if (!visualizer || !key || isRandomOrder.value) return
  loadPresetByKey(key)
})

watch(presetCycleSeconds, () => {
  if (visualizer && isRandomOrder.value) {
    startRandomCycle()
  }
})

// Разные версии Vite/Rollup по-разному "разворачивают" default-экспорт
// у CJS/UMD-пакетов. Проверяем, есть ли искомое свойство на самом
// объекте, а если нет — пробуем на вложенном .default.
function unwrapCjsExport<T extends object>(
  moduleDefault: unknown,
  probeKey: keyof T,
): T | null {
  const candidate = moduleDefault as (T & { default?: unknown }) | null | undefined
  if (candidate && typeof candidate[probeKey] === 'function') {
    return candidate as T
  }
  const nested = candidate?.default as T | undefined
  if (nested && typeof nested[probeKey] === 'function') {
    return nested
  }
  return null
}

function tryInitButterchurn() {
  if (visualizer || isLoadingLibrary || initFailed) return
  const canvas = butterchurnCanvasRef.value
  const audioContext = getAudioContext()
  const analyser = getAnalyser()
  if (!canvas || !audioContext || !analyser) return

  isLoadingLibrary = true

  Promise.all([import('butterchurn'), import('butterchurn-presets')])
    .then(([butterchurnMod, presetsMod]) => {
      butterchurn = unwrapCjsExport<typeof ButterchurnModule>(
        butterchurnMod.default,
        'createVisualizer',
      )
      const presetsCtor = unwrapCjsExport<{ getPresets(): Record<string, unknown> }>(
        presetsMod.default,
        'getPresets',
      )

      if (!canvas || !butterchurn || !presetsCtor) {
        initFailed = true
        console.error('Butterchurn: could not resolve library exports', {
          butterchurnMod,
          presetsMod,
        })
        return
      }

      visualizer = butterchurn.createVisualizer(audioContext, canvas, {
        width: canvas.clientWidth || 800,
        height: canvas.clientHeight || 600,
        pixelRatio: window.devicePixelRatio || 1,
        textureRatio: 1,
      })

      presetsMap = presetsCtor.getPresets()
      presetKeys = Object.keys(presetsMap).sort((a, b) => a.localeCompare(b))
      presetKeysShared.value = presetKeys

      visualizer.connectAudio(analyser)
      connectedNode = analyser

      resizeCanvases()

      if (isRandomOrder.value) {
        startRandomCycle()
      } else if (selectedPresetKey.value) {
        loadPresetByKey(selectedPresetKey.value)
      } else {
        pickRandomPreset()
      }
    })
    .catch((err) => {
      initFailed = true
      console.error('Butterchurn: failed to initialize visualizer', err)
    })
    .finally(() => {
      isLoadingLibrary = false
    })
}

/* ---------- Custom: "painven - glass rain 1" ---------- */

const glassRain = createGlassRainEffect()

function renderGlassRain() {
  const canvas = customCanvasRef.value
  const analyser = getAnalyser()
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  currentPresetKey.value = CUSTOM_PRESET_NAME

  if (!analyser) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return
  }

  const freqData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqData)
  glassRain.draw(ctx, canvas, freqData)
}

/* ---------- Общий цикл рендера ---------- */

function renderLoop() {
  if (selectedVisualizer.value === 'butterchurn') {
    if (!visualizer) {
      tryInitButterchurn()
    }
    const analyser = getAnalyser()
    if (visualizer && analyser && analyser !== connectedNode) {
      visualizer.connectAudio(analyser)
      connectedNode = analyser
    }
    if (visualizer) {
      visualizer.render()
    }
  } else if (selectedVisualizer.value === 'custom-glass-rain') {
    renderGlassRain()
  }

  animationFrameId = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  if (stageRef.value) {
    resizeObserver = new ResizeObserver(resizeCanvases)
    resizeObserver.observe(stageRef.value)
  }
  resizeCanvases()
  renderLoop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  stopRandomCycle()
})
</script>

<template>
  <main id="visualizer-stage" ref="stageRef" class="stage">
    <canvas
      ref="butterchurnCanvasRef"
      class="canvas"
      v-show="selectedVisualizer === 'butterchurn'"
    ></canvas>
    <canvas
      ref="customCanvasRef"
      class="canvas"
      v-show="selectedVisualizer === 'custom-glass-rain'"
    ></canvas>
  </main>
</template>

<style scoped>
.stage {
  position: relative;
  flex: 1;
  background: #000;
  min-height: 0;
}

/* В полноэкранном режиме этот элемент — единственное, что видно */
.stage:fullscreen {
  width: 100vw;
  height: 100vh;
}

.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  transition: filter 0.15s ease;
}
</style>
