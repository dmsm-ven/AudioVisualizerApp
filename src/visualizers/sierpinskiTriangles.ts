// Custom-визуализатор "triangles" — фрактальные узоры в форме
// салфетки/треугольника Серпинского, реагирующие на ритм трека.
//
// Идея:
//  - в центре экрана всегда есть один "основной" фрактал, который
//    непрерывно дышит/вращается под средние и высокие частоты —
//    так анимация никогда не статична, даже без резких ударов баса;
//  - при обнаружении удара баса (тот же принцип скользящего среднего,
//    что и в других кастомных визуализаторах) в случайном месте экрана
//    рождается дополнительный треугольник случайного размера, который
//    плавно появляется, держится и угасает;
//  - цвет каждого треугольника зависит от глубины рекурсии — от белого
//    (крупные "внешние" треугольники) до фиолетового (мелкие, глубокие
//    уровни фрактала) — получается естественный, не "накрашенный" градиент;
//  - фон всегда чёрный.

import { bandEnergy } from './audioUtils'

interface Point {
  x: number
  y: number
}

interface TriangleInstance {
  x: number
  y: number
  size: number
  rotation: number
  rotationSpeed: number
  maxDepth: number
  age: number
  lifespan: number
}

const MAX_EXTRA_INSTANCES = 6
const BASS_HISTORY_LENGTH = 40

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function trianglePoints(cx: number, cy: number, size: number, rotation: number): [Point, Point, Point] {
  const points: Point[] = []
  for (let i = 0; i < 3; i++) {
    const angle = rotation + i * ((Math.PI * 2) / 3) - Math.PI / 2
    points.push({ x: cx + Math.cos(angle) * size, y: cy + Math.sin(angle) * size })
  }
  return points as [Point, Point, Point]
}

// Белый (255,255,255) -> фиолетовый (150,60,230), по глубине рекурсии
function colorAt(depthRatio: number, alpha: number): string {
  const r = Math.round(255 + (150 - 255) * depthRatio)
  const g = Math.round(255 + (60 - 255) * depthRatio)
  const b = Math.round(255 + (230 - 255) * depthRatio)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawSierpinski(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  p3: Point,
  depthLeft: number,
  currentDepth: number,
  maxDepth: number,
  alpha: number,
) {
  if (depthLeft <= 0) {
    const t = maxDepth > 0 ? currentDepth / maxDepth : 0
    ctx.fillStyle = colorAt(t, alpha)
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.closePath()
    ctx.fill()
    return
  }

  const m12 = midpoint(p1, p2)
  const m23 = midpoint(p2, p3)
  const m31 = midpoint(p3, p1)

  drawSierpinski(ctx, p1, m12, m31, depthLeft - 1, currentDepth + 1, maxDepth, alpha)
  drawSierpinski(ctx, m12, p2, m23, depthLeft - 1, currentDepth + 1, maxDepth, alpha)
  drawSierpinski(ctx, m31, m23, p3, depthLeft - 1, currentDepth + 1, maxDepth, alpha)
}

export function createSierpinskiEffect() {
  let extraInstances: TriangleInstance[] = []
  const bassHistory: number[] = []
  let corePulsePhase = 0
  let coreRotation = 0

  function spawnInstance(canvas: HTMLCanvasElement, intensity: number) {
    if (extraInstances.length >= MAX_EXTRA_INSTANCES) return
    const minSide = Math.min(canvas.width, canvas.height)
    extraInstances.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: minSide * (0.05 + Math.random() * 0.14) * (0.7 + intensity),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      maxDepth: 3 + Math.floor(Math.random() * 3), // 3..5
      age: 0,
      lifespan: 90 + Math.random() * 70, // кадров
    })
  }

  function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, freqData: Uint8Array) {
    const bass = bandEnergy(freqData, 0, 0.08)
    const mid = bandEnergy(freqData, 0.08, 0.4)
    const treble = bandEnergy(freqData, 0.4, 1)
    const overall = (bass + mid + treble) / 3

    bassHistory.push(bass)
    if (bassHistory.length > BASS_HISTORY_LENGTH) bassHistory.shift()
    const avgBass = bassHistory.reduce((a, b) => a + b, 0) / (bassHistory.length || 1)
    const isBeat = bass > avgBass * 1.3 && bass > 0.28

    // Фон — чёрный
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Основной, всегда видимый фрактал в центре — непрерывно "дышит"
    // и вращается под средние/высокие частоты
    corePulsePhase += 0.03
    coreRotation += 0.002 + treble * 0.01
    const minSide = Math.min(canvas.width, canvas.height)
    const coreSize = minSide * (0.24 + Math.sin(corePulsePhase) * 0.02 + overall * 0.12)
    const coreDepth = 3 + Math.round(treble * 3) // 3..6 уровней
    const coreVerts = trianglePoints(canvas.width / 2, canvas.height / 2, coreSize, coreRotation)
    drawSierpinski(ctx, coreVerts[0], coreVerts[1], coreVerts[2], coreDepth, 0, coreDepth, 0.9)

    // Новый треугольник случайного размера при ударе баса
    if (isBeat) {
      spawnInstance(canvas, overall)
    }

    for (const instance of extraInstances) {
      instance.age++
      instance.rotation += instance.rotationSpeed

      const lifeRatio = instance.age / instance.lifespan
      let alpha: number
      if (lifeRatio < 0.15) {
        alpha = lifeRatio / 0.15
      } else if (lifeRatio > 0.7) {
        alpha = Math.max(0, 1 - (lifeRatio - 0.7) / 0.3)
      } else {
        alpha = 1
      }

      const verts = trianglePoints(instance.x, instance.y, instance.size, instance.rotation)
      drawSierpinski(
        ctx,
        verts[0],
        verts[1],
        verts[2],
        instance.maxDepth,
        0,
        instance.maxDepth,
        alpha * 0.85,
      )
    }

    extraInstances = extraInstances.filter((i) => i.age < i.lifespan)
  }

  return { draw }
}
