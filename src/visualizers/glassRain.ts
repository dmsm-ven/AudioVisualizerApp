// Custom-написанный визуализатор "painven - glass rain 1".
// Идея: капли дождя стекают по запотевшему стеклу, за которым угадываются
// размытые цветные огни. Всё аудио-реактивно:
//  - общая интенсивность спектра управляет частотой появления капель;
//  - низкие частоты (бас) периодически вызывают "рябь" на стекле (удар капли);
//  - три частотных диапазона (бас/середина/верх) управляют яркостью и цветом
//    трёх фоновых цветовых пятен.

interface Drop {
  x: number
  y: number
  radius: number
  speed: number
  wobble: number
  history: number[] // предыдущие Y-позиции, самая свежая — первая
}

interface Ripple {
  x: number
  y: number
  radius: number
  alpha: number
}

const MAX_DROPS = 140
const TRAIL_LENGTH = 10
const BASS_HISTORY_LENGTH = 40

function bandEnergy(data: Uint8Array, fromRatio: number, toRatio: number): number {
  const from = Math.floor(data.length * fromRatio)
  const to = Math.max(from + 1, Math.floor(data.length * toRatio))
  let sum = 0
  for (let i = from; i < to; i++) {
    sum += data[i] ?? 0
  }
  return sum / (to - from) / 255
}

export function createGlassRainEffect() {
  let drops: Drop[] = []
  let ripples: Ripple[] = []
  const bassHistory: number[] = []

  function spawnDrop(canvas: HTMLCanvasElement, intensity: number) {
    const isBigDrop = Math.random() < 0.15 + intensity * 0.3
    const radius = isBigDrop
      ? 3 + Math.random() * 5 * (0.6 + intensity)
      : 1 + Math.random() * 2
    drops.push({
      x: Math.random() * canvas.width,
      y: -10,
      radius,
      speed: (radius * 0.6 + 1.5) * (0.6 + intensity * 1.4),
      wobble: Math.random() * Math.PI * 2,
      history: [],
    })
  }

  function spawnRipple(canvas: HTMLCanvasElement) {
    ripples.push({
      x: Math.random() * canvas.width,
      y: canvas.height * (0.55 + Math.random() * 0.4),
      radius: 6,
      alpha: 0.5,
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
    const isBeat = bass > avgBass * 1.35 && bass > 0.3

    // --- Фон: размытые цветные огни за стеклом ---
    ctx.fillStyle = '#05060a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.filter = 'blur(40px)'
    const blobs = [
      { xf: 0.2, yf: 0.3, hue: 200, energy: bass },
      { xf: 0.6, yf: 0.2, hue: 280, energy: mid },
      { xf: 0.8, yf: 0.55, hue: 20, energy: treble },
      { xf: 0.35, yf: 0.7, hue: 320, energy: mid },
    ]
    for (const b of blobs) {
      const radius = canvas.width * (0.12 + b.energy * 0.12)
      const grad = ctx.createRadialGradient(
        b.xf * canvas.width,
        b.yf * canvas.height,
        0,
        b.xf * canvas.width,
        b.yf * canvas.height,
        radius,
      )
      grad.addColorStop(0, `hsla(${b.hue}, 90%, ${50 + b.energy * 20}%, ${0.35 + b.energy * 0.4})`)
      grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(b.xf * canvas.width, b.yf * canvas.height, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // Лёгкая дымка — имитация запотевшего стекла
    ctx.fillStyle = `rgba(10, 12, 18, ${0.18 - overall * 0.08})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // --- Появление новых капель, частота зависит от громкости ---
    const spawnCount = Math.floor(1 + overall * 6 + (isBeat ? 4 : 0))
    for (let i = 0; i < spawnCount && drops.length < MAX_DROPS; i++) {
      spawnDrop(canvas, overall)
    }
    if (isBeat && Math.random() < 0.8) {
      spawnRipple(canvas)
    }

    // --- Отрисовка капель со следом ---
    ctx.save()
    for (const drop of drops) {
      drop.wobble += 0.05
      drop.x += Math.sin(drop.wobble) * 0.3
      drop.y += drop.speed

      drop.history.unshift(drop.y)
      if (drop.history.length > TRAIL_LENGTH) drop.history.pop()

      for (let i = 0; i < drop.history.length - 1; i++) {
        const from = drop.history[i]
        const to = drop.history[i + 1]
        if (from === undefined || to === undefined) continue
        const alpha = (1 - i / TRAIL_LENGTH) * 0.35
        ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`
        ctx.lineWidth = Math.max(0.5, drop.radius * 0.3)
        ctx.beginPath()
        ctx.moveTo(drop.x, from)
        ctx.lineTo(drop.x, to)
        ctx.stroke()
      }

      const dropGrad = ctx.createRadialGradient(
        drop.x - drop.radius * 0.3,
        drop.y - drop.radius * 0.3,
        0,
        drop.x,
        drop.y,
        drop.radius,
      )
      dropGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
      dropGrad.addColorStop(0.4, 'rgba(200,230,255,0.55)')
      dropGrad.addColorStop(1, 'rgba(200,230,255,0)')
      ctx.fillStyle = dropGrad
      ctx.beginPath()
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    drops = drops.filter((d) => d.y - d.radius < canvas.height + 20)

    // --- Рябь на стекле от басовых "ударов" ---
    ctx.save()
    for (const ripple of ripples) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(190, 225, 255, ${ripple.alpha})`
      ctx.lineWidth = 1.5
      ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()
      ripple.radius += 2.2
      ripple.alpha -= 0.015
    }
    ctx.restore()
    ripples = ripples.filter((r) => r.alpha > 0.02)
  }

  return { draw }
}
