import { ref, watch } from 'vue'

// Единый (singleton) экземпляр плеера — используется и в TopMenu, и в VisualizerStage
const audio = new Audio()

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const trackTitle = ref('Файл не выбран')
const fileSizeMb = ref<string | null>(null)

// Громкость. UI работает со шкалой 0..100 (как привычно для слайдера),
// но фактическое значение audio.volume вычисляется по логарифмической
// кривой (в dB), чтобы слайдер ощущался линейным на слух — человеческое
// восприятие громкости само по себе логарифмическое.
const volumePercent = ref(80)
const MIN_DB = -40

function percentToLinearVolume(percent: number): number {
  if (percent <= 0) return 0
  const db = (percent / 100) * -MIN_DB + MIN_DB // -40dB..0dB
  return Math.pow(10, db / 20)
}

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceConnected = false
let objectUrl: string | null = null

function ensureAudioGraph() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (!sourceConnected) {
    const source = audioContext.createMediaElementSource(audio)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyser.connect(audioContext.destination)
    sourceConnected = true
  }
}

function loadFile(file: File) {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
  objectUrl = URL.createObjectURL(file)
  audio.src = objectUrl

  trackTitle.value = file.name.replace(/\.[^/.]+$/, '')
  fileSizeMb.value = (file.size / (1024 * 1024)).toFixed(2)

  ensureAudioGraph()
  audioContext?.resume()
  audio.play()
}

function togglePlay() {
  if (!audio.src) return
  ensureAudioGraph()
  audioContext?.resume()
  if (isPlaying.value) {
    audio.pause()
  } else {
    audio.play()
  }
}

function seekTo(seconds: number) {
  if (!audio.src || !Number.isFinite(seconds)) return
  audio.currentTime = Math.min(Math.max(seconds, 0), duration.value || seconds)
}

audio.volume = percentToLinearVolume(volumePercent.value)
watch(volumePercent, (percent) => {
  audio.volume = percentToLinearVolume(percent)
})

const endedCallbacks: Array<() => void> = []

function onTrackEnded(callback: () => void) {
  endedCallbacks.push(callback)
}

audio.addEventListener('play', () => {
  isPlaying.value = true
})
audio.addEventListener('pause', () => {
  isPlaying.value = false
})
audio.addEventListener('ended', () => {
  isPlaying.value = false
  endedCallbacks.forEach((cb) => cb())
})
audio.addEventListener('timeupdate', () => {
  currentTime.value = audio.currentTime
})
audio.addEventListener('loadedmetadata', () => {
  duration.value = audio.duration
})

export function useAudioPlayer() {
  return {
    isPlaying,
    currentTime,
    duration,
    trackTitle,
    fileSizeMb,
    volumePercent,
    loadFile,
    togglePlay,
    seekTo,
    onTrackEnded,
    getAnalyser: () => analyser,
    getAudioContext: () => audioContext,
  }
}
