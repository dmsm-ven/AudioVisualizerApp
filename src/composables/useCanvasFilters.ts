import { reactive } from 'vue'

export interface FilterDef {
  key: string
  label: string
  cssFn: string
  unit: string
  min: number
  max: number
  default: number
  step: number
}

// Стандартные функции CSS-свойства `filter` — ничего самодельного,
// просто UI-обёртка над обычным filter: blur(...) saturate(...) и т.д.
export const filterDefs: FilterDef[] = [
  { key: 'blur', label: 'Блюр', cssFn: 'blur', unit: 'px', min: 0, max: 20, default: 4, step: 0.5 },
  {
    key: 'saturate',
    label: 'Насыщенность',
    cssFn: 'saturate',
    unit: '%',
    min: 0,
    max: 300,
    default: 150,
    step: 5,
  },
  {
    key: 'brightness',
    label: 'Яркость',
    cssFn: 'brightness',
    unit: '%',
    min: 0,
    max: 200,
    default: 120,
    step: 5,
  },
  {
    key: 'contrast',
    label: 'Контраст',
    cssFn: 'contrast',
    unit: '%',
    min: 0,
    max: 200,
    default: 120,
    step: 5,
  },
  {
    key: 'hueRotate',
    label: 'Поворот оттенка',
    cssFn: 'hue-rotate',
    unit: 'deg',
    min: 0,
    max: 360,
    default: 90,
    step: 5,
  },
  {
    key: 'grayscale',
    label: 'Оттенки серого',
    cssFn: 'grayscale',
    unit: '%',
    min: 0,
    max: 100,
    default: 50,
    step: 5,
  },
  { key: 'sepia', label: 'Сепия', cssFn: 'sepia', unit: '%', min: 0, max: 100, default: 50, step: 5 },
  {
    key: 'invert',
    label: 'Инверсия',
    cssFn: 'invert',
    unit: '%',
    min: 0,
    max: 100,
    default: 100,
    step: 5,
  },
]

const enabledMap = reactive<Record<string, boolean>>(
  Object.fromEntries(filterDefs.map((f) => [f.key, false])),
)
const valueMap = reactive<Record<string, number>>(
  Object.fromEntries(filterDefs.map((f) => [f.key, f.default])),
)

export function buildFilterCss(): string {
  const parts: string[] = []
  for (const f of filterDefs) {
    if (enabledMap[f.key]) {
      parts.push(`${f.cssFn}(${valueMap[f.key]}${f.unit})`)
    }
  }
  return parts.length > 0 ? parts.join(' ') : 'none'
}

export function useCanvasFilters() {
  return { filterDefs, enabledMap, valueMap }
}
