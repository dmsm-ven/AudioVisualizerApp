<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { useVisualizerSelection } from '../composables/useVisualizerSelection'

const { getAnalyser } = useAudioPlayer()
const { selectedVisualizer } = useVisualizerSelection()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId = 0
let resizeObserver: ResizeObserver | null = null

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
}

function clear(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, fade = 1) {
  ctx.fillStyle = fade < 1 ? `rgba(0, 0, 0, ${fade})` : '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

/* #1 — Спектр (столбцы) */
function drawBars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: Uint8Array) {
  clear(ctx, canvas)
  const bufferLength = data.length
  const barWidth = (canvas.width / bufferLength) * 2.5
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const value = data[i] ?? 0
    const barHeight = (value / 255) * canvas.height
    const hue = (i / bufferLength) * 200 + 160
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
    x += barWidth + 1
    if (x > canvas.width) break
  }
}

/* #4 — Зеркальный спектр: столбцы растут от центральной линии вверх и вниз */
function drawMirroredBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: Uint8Array,
) {
  clear(ctx, canvas)
  const bufferLength = data.length
  const barWidth = (canvas.width / bufferLength) * 2.5
  const centerY = canvas.height / 2
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const value = data[i] ?? 0
    const halfHeight = (value / 255) * (canvas.height / 2)
    const hue = (i / bufferLength) * 200 + 160
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`
    ctx.fillRect(x, centerY - halfHeight, barWidth, halfHeight * 2)
    x += barWidth + 1
    if (x > canvas.width) break
  }
}

/* #6 — Плазма: несколько наложенных "жидких" волн по данным временной области */
let plasmaPhase = 0
function drawPlasma(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  timeData: Uint8Array,
) {
  clear(ctx, canvas, 0.25) // лёгкий шлейф вместо полной очистки — придаёт "жидкость"
  plasmaPhase += 0.02

  const layers = [
    { amp: 0.9, freq: 1.2, hue: 200, speed: 1.0, widthMul: 1.0 },
    { amp: 0.6, freq: 1.8, hue: 280, speed: -0.7, widthMul: 1.3 },
    { amp: 0.4, freq: 2.4, hue: 330, speed: 1.4, widthMul: 0.8 },
  ]

  const centerY = canvas.height / 2
  const bufferLength = timeData.length

  for (const layer of layers) {
    ctx.beginPath()
    for (let x = 0; x <= canvas.width; x += 4) {
      const dataIndex = Math.floor((x / canvas.width) * bufferLength)
      const sample = ((timeData[dataIndex] ?? 128) - 128) / 128 // -1..1
      const wave =
        Math.sin(x * 0.01 * layer.freq + plasmaPhase * layer.speed) * layer.amp * 60
      const y = centerY + wave + sample * 80 * layer.widthMul
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.strokeStyle = `hsla(${layer.hue}, 90%, 60%, 0.8)`
    ctx.lineWidth = 3
    ctx.shadowColor = `hsla(${layer.hue}, 90%, 60%, 0.8)`
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0
  }
}

/* #7 — Кольца: пульсация от центра при ударах баса (простое beat detection) */
interface Ring {
  radius: number
  alpha: number
  hue: number
}
let rings: Ring[] = []
let ringCooldown = 0
let bassHistory: number[] = []

function getBassEnergy(data: Uint8Array): number {
  const bassBins = Math.max(1, Math.floor(data.length * 0.08))
  let sum = 0
  for (let i = 0; i < bassBins; i++) {
    sum += data[i] ?? 0
  }
  return sum / bassBins / 255 // 0..1
}

function drawPulseRings(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: Uint8Array,
) {
  clear(ctx, canvas)

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const bass = getBassEnergy(data)

  bassHistory.push(bass)
  if (bassHistory.length > 30) bassHistory.shift()
  const avgBass = bassHistory.reduce((a, b) => a + b, 0) / (bassHistory.length || 1)

  if (ringCooldown > 0) ringCooldown--

  // Новое кольцо при заметном ударе баса выше среднего фона
  if (bass > avgBass * 1.3 && bass > 0.35 && ringCooldown === 0) {
    rings.push({ radius: 20, alpha: 1, hue: Math.random() * 360 })
    ringCooldown = 8
  }

  // Пульсирующий центральный круг — отражает текущую громкость баса
  const pulseRadius = 20 + bass * 60
  const pulseGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius)
  pulseGrad.addColorStop(0, `hsla(200, 90%, 60%, 0.9)`)
  pulseGrad.addColorStop(1, `hsla(200, 90%, 60%, 0)`)
  ctx.fillStyle = pulseGrad
  ctx.beginPath()
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
  ctx.fill()

  rings = rings.filter((ring) => ring.alpha > 0.02)
  for (const ring of rings) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `hsla(${ring.hue}, 90%, 60%, ${ring.alpha})`
    ctx.lineWidth = 3
    ctx.stroke()

    ring.radius += 4
    ring.alpha -= 0.015
  }
}

function renderLoop() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  const analyser = getAnalyser()

  if (canvas && ctx) {
    if (!analyser) {
      clear(ctx, canvas)
    } else {
      const freqData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(freqData)

      switch (selectedVisualizer.value) {
        case 'mirrored-bars':
          drawMirroredBars(ctx, canvas, freqData)
          break
        case 'plasma': {
          const timeData = new Uint8Array(analyser.fftSize)
          analyser.getByteTimeDomainData(timeData)
          drawPlasma(ctx, canvas, timeData)
          break
        }
        case 'pulse-rings':
          drawPulseRings(ctx, canvas, freqData)
          break
        case 'bars':
        default:
          drawBars(ctx, canvas, freqData)
          break
      }
    }
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
