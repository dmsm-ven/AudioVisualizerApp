<script setup lang="ts">
import { useButterchurnSettings } from "../composables/useButterchurnSettings";
import { filterDefs, useCanvasFilters } from "../composables/useCanvasFilters";

const {
  presetKeys,
  isRandomOrder,
  presetCycleSeconds,
  selectedPresetKey,
  currentPresetKey,
} = useButterchurnSettings();

const { enabledMap, valueMap } = useCanvasFilters();
</script>

<template>
  <div class="settings-panel">
    <div class="settings-title">Настройки визуализации</div>

    <label class="random-toggle">
      <input type="checkbox" v-model="isRandomOrder" />
      Случайный порядок
    </label>

    <div class="field">
      <label class="field-label" for="cycle-length">
        Смена пресета каждые:
        <span class="field-value">{{ presetCycleSeconds }} сек</span>
      </label>
      <input
        id="cycle-length"
        type="range"
        min="3"
        max="300"
        step="1"
        v-model.number="presetCycleSeconds"
        class="slider"
      />
    </div>

    <label class="field-label" for="preset-select">Пресет</label>
    <select
      id="preset-select"
      v-model="selectedPresetKey"
      class="preset-select"
      :disabled="isRandomOrder || presetKeys.length === 0"
    >
      <option v-if="presetKeys.length === 0" value="" disabled>
        Загрузка пресетов…
      </option>
      <option v-for="key in presetKeys" :key="key" :value="key">
        {{ key }}
      </option>
    </select>

    <div v-if="currentPresetKey" class="current-preset">
      Сейчас: <span class="current-preset-name">{{ currentPresetKey }}</span>
    </div>

    <div class="section-title">Фильтры холста</div>
    <div class="filters-list">
      <div v-for="filter in filterDefs" :key="filter.key" class="filter-row">
        <label class="filter-toggle">
          <input type="checkbox" v-model="enabledMap[filter.key]" />
          {{ filter.label }}
        </label>
        <input
          type="range"
          class="slider filter-slider"
          :min="filter.min"
          :max="filter.max"
          :step="filter.step"
          v-model.number="valueMap[filter.key]"
          :disabled="!enabledMap[filter.key]"
        />
        <span class="filter-value"
          >{{ valueMap[filter.key] }}{{ filter.unit }}</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-width: 90vw;
  max-height: 70vh;
  overflow-y: auto;
  background: #1b1b1f;
  border: 1px solid #3a3a40;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 20;
  color: #e6e6e6;
  font-family: "Segoe UI", sans-serif;
  font-size: 0.85rem;
}

.settings-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #7fdcff;
}

.section-title {
  font-weight: 600;
  margin: 14px 0 8px;
  padding-top: 10px;
  border-top: 1px solid #2a2a2e;
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

.field {
  margin-bottom: 10px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: #aaa;
}

.field-value {
  color: #ffb37f;
  font-variant-numeric: tabular-nums;
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

.filters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: grid;
  grid-template-columns: 110px 1fr 48px;
  align-items: center;
  gap: 8px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  text-wrap: nowrap;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  color: #ccc;
  font-size: 0.8rem;
}

.filter-value {
  text-align: right;
  color: #ffb37f;
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #3a3a40;
  outline: none;
  cursor: pointer;
}

.slider:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7fdcff;
  cursor: pointer;
  border: none;
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7fdcff;
  cursor: pointer;
  border: none;
}
</style>
