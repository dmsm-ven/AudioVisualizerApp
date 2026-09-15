import { ref } from 'vue'

export interface VisualizerOption {
  value: string
  label: string
}

export const visualizers: VisualizerOption[] = [
  { value: 'butterchurn', label: 'MilkDrop (Butterchurn)' },
  { value: 'custom-glass-rain', label: 'Custom' },
]

const selectedVisualizer = ref<string>(visualizers[0]?.value ?? 'bars')

export function useVisualizerSelection() {
  return {
    visualizers,
    selectedVisualizer,
  }
}
