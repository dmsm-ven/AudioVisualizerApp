<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useAudioPlayer } from '../composables/useAudioPlayer'

const { getAnalyser } = useAudioPlayer()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId = 0
let resizeObserver: ResizeObserver | null = null

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
}

function drawBars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const analyser = getAnalyser()

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (!analyser) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  const barWidth = (canvas.width / bufferLength) * 2.5
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i] ?? 0
    const barHeight = (value / 255) * canvas.height

    const hue = (i / bufferLength) * 200 + 160 // сине-фиолетово-розовый спектр
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

    x += barWidth + 1
    if (x > canvas.width) break
  }
}

function renderLoop() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (canvas && ctx) {
    drawBars(ctx, canvas)
  }
  animationFrameId = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  resizeCanvas()
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvasRef.value)
  }
  renderLoop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
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
