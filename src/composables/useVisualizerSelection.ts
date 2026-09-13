import { ref } from 'vue'

export interface VisualizerOption {
  value: string
  label: string
}

export const visualizers: VisualizerOption[] = [
  { value: 'bars', label: 'Спектр (столбцы)' },
  { value: 'mirrored-bars', label: 'Зеркальный спектр' },
  { value: 'plasma', label: 'Плазма (жидкие волны)' },
  { value: 'pulse-rings', label: 'Кольца (пульсация)' },
]

const selectedVisualizer = ref<string>(visualizers[0]?.value ?? 'bars')

export function useVisualizerSelection() {
  return {
    visualizers,
    selectedVisualizer,
  }
}
