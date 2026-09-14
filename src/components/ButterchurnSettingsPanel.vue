<script setup lang="ts">
import { useButterchurnSettings } from '../composables/useButterchurnSettings'

const { presetKeys, isRandomOrder, selectedPresetKey, currentPresetKey } =
  useButterchurnSettings()
</script>

<template>
  <div class="settings-panel">
    <div class="settings-title">Настройки визуализации</div>

    <label class="random-toggle">
      <input type="checkbox" v-model="isRandomOrder" />
      Случайный порядок
    </label>

    <label class="preset-label" for="preset-select">Пресет</label>
    <select
      id="preset-select"
      v-model="selectedPresetKey"
      class="preset-select"
      :disabled="isRandomOrder || presetKeys.length === 0"
    >
      <option v-if="presetKeys.length === 0" value="" disabled>Загрузка пресетов…</option>
      <option v-for="key in presetKeys" :key="key" :value="key">
        {{ key }}
      </option>
    </select>

    <div v-if="currentPresetKey" class="current-preset">
      Сейчас: <span class="current-preset-name">{{ currentPresetKey }}</span>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-width: 90vw;
  background: #1b1b1f;
  border: 1px solid #3a3a40;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 20;
  color: #e6e6e6;
  font-family: 'Segoe UI', sans-serif;
  font-size: 0.85rem;
}

.settings-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #7fdcff;
}

.random-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;
}

.preset-label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
}

.preset-select {
  width: 100%;
  padding: 6px 8px;
  background: #2a2a2e;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  color: #e6e6e6;
  font-size: 0.85rem;
  max-width: 100%;
}

.preset-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-preset {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #2a2a2e;
  color: #aaa;
  overflow-wrap: break-word;
}

.current-preset-name {
  color: #ffb37f;
}
</style>
