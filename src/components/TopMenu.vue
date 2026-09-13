<script setup lang="ts">
import { ref } from 'vue'

// Заглушки — без логики, только UI-состояние для отображения каркаса
const isPlaying = ref(false)
const selectedVisualizer = ref('bars')

const visualizers = [
  { value: 'bars', label: 'Спектр (столбцы)' },
  { value: 'wave', label: 'Осциллограф (волна)' },
  { value: 'circle', label: 'Круговой спектр' },
  { value: 'particles', label: 'Частицы' },
]

// Заглушка прогресса/названия трека — потом заменится реальными данными
const currentTime = '00:45'
const totalTime = '05:59'
const trackTitle = 'Linkin Park - Numb'

function togglePlay() {
  isPlaying.value = !isPlaying.value
}

function chooseFile() {
  // TODO: логика выбора файла появится позже
}
</script>

<template>
  <header class="top-menu">
    <div class="row row-1">
      <div class="cell">
        <button class="btn play-btn" type="button" @click="togglePlay">
          {{ isPlaying ? '⏹ Stop' : '▶ Play' }}
        </button>
      </div>

      <div class="cell">
        <button class="btn" type="button" @click="chooseFile">
          📂 Выбрать файл
        </button>
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
      <div class="cell track-info" colspan="3">
        <span class="progress">{{ currentTime }} / {{ totalTime }}</span>
        <span class="separator">|</span>
        <span class="track-title">{{ trackTitle }}</span>
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
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
}

.row-1 {
  padding: 8px 12px;
  gap: 12px;
}

.row-2 {
  padding: 4px 12px 10px;
  border-top: 1px solid #2a2a2e;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-info {
  grid-column: 1 / span 3;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #aaa;
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

.btn {
  width: 100%;
  padding: 6px 10px;
  background: #2a2a2e;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  color: #e6e6e6;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s ease;
}

.btn:hover {
  background: #3a3a40;
}

.play-btn {
  color: #7fffa1;
  font-weight: 600;
}

.visualizer-select {
  width: 100%;
  padding: 6px 8px;
  background: #2a2a2e;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  color: #e6e6e6;
  font-size: 0.9rem;
}
</style>
