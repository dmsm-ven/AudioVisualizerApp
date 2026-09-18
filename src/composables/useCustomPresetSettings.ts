import { ref } from 'vue'

export interface CustomPresetOption {
  key: string
  label: string
}

export const customPresets: CustomPresetOption[] = [
  { key: 'painven - glass rain 1', label: 'Glass Rain' },
  { key: 'triangles', label: 'Triangles (Серпинский)' },
]

const selectedCustomPreset = ref<string>(customPresets[0]?.key ?? 'painven - glass rain 1')

export function useCustomPresetSettings() {
  return {
    customPresets,
    selectedCustomPreset,
  }
}
