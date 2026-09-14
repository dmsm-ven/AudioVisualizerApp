<script setup lang="ts">
import { ref } from 'vue'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { useVisualizerSelection } from '../composables/useVisualizerSelection'
import ButterchurnSettingsPanel from './ButterchurnSettingsPanel.vue'

const {
  isPlaying,
  currentTime,
  duration,
  trackTitle,
  fileSizeMb,
  volumePercent,
  loadFile,
  togglePlay,
  seekTo,
} = useAudioPlayer()

const { visualizers, selectedVisualizer } = useVisualizerSelection()

const fileInput = ref<HTMLInputElement | null>(null)
const showSettings = ref(false)

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function chooseFile() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  loadFile(file)
  input.value = ''
}

function openFullscreen() {
  const stage = document.getElementById('visualizer-stage')
  stage?.requestFullscreen()
}

function onSeekInput(event: Event) {
  const input = event.target as HTMLInputElement
  seekTo(Number(input.value))
}

function toggleSettings() {
  showSettings.value = !showSettings.value
}
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
          <option v-for="viz in visualizers" :key="viz.value" :value="viz.value">
            {{ viz.label }}
          </option>
        </select>
      </div>

      <div class="cell cell-settings">
        <button
          class="btn btn-icon"
          type="button"
          title="Настройки визуализации"
          @click="toggleSettings"
        >
          ⚙
        </button>
        <ButterchurnSettingsPanel v-if="showSettings" />
      </div>

      <div class="cell">
        <button
          class="btn btn-icon"
          type="button"
          title="Открыть на весь экран"
          @click="openFullscreen"
        >
          ⛶
        </button>
      </div>
    </div>

    <div class="row row-seek">
      <span class="time-label">{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        class="seek-slider"
        min="0"
        :max="duration || 0"
        step="0.1"
        :value="currentTime"
        :disabled="!fileSizeMb"
        @input="onSeekInput"
      />
      <span class="time-label">{{ formatTime(duration) }}</span>
    </div>

    <div class="row row-2">
      <div class="track-info">
        <span class="track-title">{{ trackTitle }}</span>
        <template v-if="fileSizeMb">
          <span class="separator">|</span>
          <span class="file-size">{{ fileSizeMb }} MB</span>
        </template>
      </div>

      <div class="volume-control">
        <span class="volume-icon">{{ volumePercent === 0 ? '🔇' : '🔊' }}</span>
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="100"
          step="1"
          v-model.number="volumePercent"
          title="Громкость"
        />
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
  grid-template-columns: auto auto auto auto auto;
  justify-content: center;
  padding: 8px 12px;
  gap: 20px;
  width: fit-content;
  margin: 0 auto;
  position: relative;
}

.row-seek {
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 2px 14px;
}

.row-2 {
  grid-template-columns: 1fr auto;
  padding: 4px 14px 10px;
  border-top: 1px solid #2a2a2e;
  gap: 16px;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.track-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 0.9rem;
  color: #aaa;
  flex-wrap: wrap;
  min-width: 0;
}

.time-label {
  font-variant-numeric: tabular-nums;
  color: #7fdcff;
  font-size: 0.8rem;
  min-width: 38px;
  text-align: center;
}

.separator {
  color: #555;
}

.track-title {
  color: #e6e6e6;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #ffb37f;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
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

.cell-settings {
  position: relative;
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

/* Range inputs (seek + volume) — единый минималистичный стиль */
.seek-slider,
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a40;
  outline: none;
  cursor: pointer;
}

.seek-slider {
  width: 100%;
}

.seek-slider:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.seek-slider::-webkit-slider-thumb,
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7fdcff;
  cursor: pointer;
  border: none;
}

.seek-slider::-moz-range-thumb,
.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7fdcff;
  cursor: pointer;
  border: none;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.volume-icon {
  font-size: 0.9rem;
}

.volume-slider {
  width: 100px;
}
</style>
