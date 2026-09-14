<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type ButterchurnModule from 'butterchurn'
import { useAudioPlayer } from '../composables/useAudioPlayer'

const { getAnalyser, getAudioContext } = useAudioPlayer()

const canvasRef = ref<HTMLCanvasElement | null>(null)

type Visualizer = ReturnType<typeof ButterchurnModule.createVisualizer>

let butterchurn: typeof ButterchurnModule | null = null
let visualizer: Visualizer | null = null
let connectedNode: AudioNode | null = null
let animationFrameId = 0
let resizeObserver: ResizeObserver | null = null
let presetCycleInterval: ReturnType<typeof setInterval> | null = null
let isLoadingLibrary = false
let initFailed = false

const PRESET_CYCLE_SECONDS = 20
const PRESET_BLEND_SECONDS = 2.7

let presetKeys: string[] = []
let presetsMap: Record<string, unknown> = {}

function pickRandomPreset() {
  if (!visualizer || presetKeys.length === 0) return
  const key = presetKeys[Math.floor(Math.random() * presetKeys.length)]
  if (key) {
    visualizer.loadPreset(presetsMap[key], PRESET_BLEND_SECONDS)
  }
}

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

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !visualizer) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = width
  canvas.height = height
  visualizer.setRendererSize(width, height)
}

function tryInitVisualizer() {
  if (visualizer || isLoadingLibrary || initFailed) return
  const canvas = canvasRef.value
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
      presetKeys = Object.keys(presetsMap)

      visualizer.connectAudio(analyser)
      connectedNode = analyser

      resizeCanvas()
      pickRandomPreset()

      presetCycleInterval = setInterval(pickRandomPreset, PRESET_CYCLE_SECONDS * 1000)
    })
    .catch((err) => {
      initFailed = true
      console.error('Butterchurn: failed to initialize visualizer', err)
    })
    .finally(() => {
      isLoadingLibrary = false
    })
}

function renderLoop() {
  // Аудиограф создаётся лениво (после выбора файла) — пробуем инициализировать
  // визуализатор на каждом кадре, пока он ещё не создан.
  if (!visualizer) {
    tryInitVisualizer()
  }

  // Если узел-источник сменился (например, граф был пересоздан), переподключаемся
  const analyser = getAnalyser()
  if (visualizer && analyser && analyser !== connectedNode) {
    visualizer.connectAudio(analyser)
    connectedNode = analyser
  }

  if (visualizer) {
    visualizer.render()
  }

  animationFrameId = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvasRef.value)
  }
  renderLoop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  if (presetCycleInterval) {
    clearInterval(presetCycleInterval)
  }
})
</script>

<template>
  <main id="visualizer-stage" class="stage">
    <canvas ref="canvasRef" class="canvas"></canvas>
  </main>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  background: #000;
  min-height: 0;
}

/* В полноэкранном режиме этот элемент — единственное, что видно */
.stage:fullscreen {
  width: 100vw;
  height: 100vh;
}

.canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
