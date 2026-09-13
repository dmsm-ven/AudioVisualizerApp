import { ref } from 'vue'

// Единый (singleton) экземпляр плеера — используется и в TopMenu, и в VisualizerStage
const audio = new Audio()

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const trackTitle = ref('Файл не выбран')
const fileSizeMb = ref<string | null>(null)

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

audio.addEventListener('play', () => {
  isPlaying.value = true
})
audio.addEventListener('pause', () => {
  isPlaying.value = false
})
audio.addEventListener('ended', () => {
  isPlaying.value = false
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
    loadFile,
    togglePlay,
    getAnalyser: () => analyser,
    getAudioContext: () => audioContext,
  }
}
