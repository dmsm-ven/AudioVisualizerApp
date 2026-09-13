<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const isPlaying = ref(false)
const selectedVisualizer = ref('bars')

const visualizers = [
  { value: 'bars', label: 'Спектр (столбцы)' },
  { value: 'wave', label: 'Осциллограф (волна)' },
  { value: 'circle', label: 'Круговой спектр' },
  { value: 'particles', label: 'Частицы' },
]

// Состояние плеера
const audio = new Audio()
const fileInput = ref<HTMLInputElement | null>(null)

const trackTitle = ref('Файл не выбран')
const fileSizeMb = ref<string | null>(null)
const currentTime = ref(0)
const duration = ref(0)

let objectUrl: string | null = null

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function togglePlay() {
  if (!audio.src) return
  if (isPlaying.value) {
    audio.pause()
  } else {
    audio.play()
  }
}

function chooseFile() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Освобождаем предыдущий URL, если был
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }

  objectUrl = URL.createObjectURL(file)
  audio.src = objectUrl

  // Имя файла без расширения — как временное название трека
  trackTitle.value = file.name.replace(/\.[^/.]+$/, '')
  fileSizeMb.value = (file.size / (1024 * 1024)).toFixed(2)

  audio.play()

  // Сбрасываем input, чтобы можно было повторно выбрать тот же файл
  input.value = ''
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

onBeforeUnmount(() => {
  audio.pause()
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
})
</script>

<template>
  <header class="top-menu">
    <div class="row row-1">
      <div class="cell cell-transport">
        <button
          class="btn btn-small play-btn"
          type="button"
          :disabled="!fileSizeMb || isPlaying"
          @click="togglePlay"
        >
          ▶
        </button>
        <button
          class="btn btn-small stop-btn"
          type="button"
          :disabled="!fileSizeMb || !isPlaying"
          @click="togglePlay"
        >
          ⏹
        </button>
      </div>

      <div class="cell cell-file">
        <button class="btn btn-icon" type="button" title="Выбрать файл" @click="chooseFile">
          📂
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="audio/mpeg,audio/mp4,.mp3,.m4a"
          class="hidden-input"
          @change="onFileSelected"
        />
      </div>

      <div class="cell">
        <select v-model="selectedVisualizer" class="visualizer-select">
          <option
            v-for="viz in visualizers"
            :key="viz.value"
            :value="viz.value"
          >
            {{ viz.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="row row-2">
      <div class="cell track-info">
        <span class="progress">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <span class="separator">|</span>
        <span class="track-title">{{ trackTitle }}</span>
        <template v-if="fileSizeMb">
          <span class="separator">|</span>
          <span class="file-size">{{ fileSizeMb }} MB</span>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-menu {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #1b1b1f;
  border-bottom: 1px solid #333;
  color: #e6e6e6;
  font-family: 'Segoe UI', sans-serif;
  user-select: none;
}

.row {
  display: grid;
  align-items: center;
}

.row-1 {
  grid-template-columns: auto auto auto;
  justify-content: center;
  padding: 8px 12px;
  gap: 20px;
  width: fit-content;
  margin: 0 auto;
}

.row-2 {
  grid-template-columns: 1fr;
  padding: 4px 12px 10px;
  border-top: 1px solid #2a2a2e;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-info {
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #aaa;
  flex-wrap: wrap;
}

.progress {
  font-variant-numeric: tabular-nums;
  color: #7fdcff;
}

.separator {
  color: #555;
}

.track-title {
  color: #e6e6e6;
  font-weight: 500;
}

.file-size {
  color: #ffb37f;
  font-variant-numeric: tabular-nums;
}

.hidden-input {
  display: none;
}

.cell-transport {
  gap: 6px;
}

.cell-file {
  justify-content: flex-end;
}

.btn {
  padding: 6px 10px;
  background: #2a2a2e;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  color: #e6e6e6;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s ease;
}

.btn:hover:not(:disabled) {
  background: #3a3a40;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-small {
  width: 30px;
  height: 30px;
  padding: 0;
  line-height: 1;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn {
  color: #7fffa1;
}

.stop-btn {
  color: #ff8f8f;
}

.visualizer-select {
  padding: 6px 8px;
  background: #2a2a2e;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  color: #e6e6e6;
  font-size: 0.9rem;
}
</style>
