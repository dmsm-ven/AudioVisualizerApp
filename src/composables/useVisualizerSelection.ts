import { ref } from 'vue'

export interface VisualizerOption {
  value: string
  label: string
}

export const visualizers: VisualizerOption[] = [
  { value: 'butterchurn', label: 'MilkDrop (Butterchurn)' },
]

const selectedVisualizer = ref<string>(visualizers[0]?.value ?? 'bars')

export function useVisualizerSelection() {
  return {
    visualizers,
    selectedVisualizer,
  }
}
