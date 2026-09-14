import { ref } from 'vue'

// Заполняется VisualizerStage после загрузки библиотеки пресетов
const presetKeys = ref<string[]>([])

// true = автоматическая смена случайных пресетов (поведение по умолчанию)
const isRandomOrder = ref(true)

// Пресет, выбранный пользователем вручную (используется, когда isRandomOrder = false)
const selectedPresetKey = ref<string | null>(null)

// Пресет, который сейчас реально отображается — для UI (например, подсветка в списке)
const currentPresetKey = ref<string | null>(null)

export function useButterchurnSettings() {
  return {
    presetKeys,
    isRandomOrder,
    selectedPresetKey,
    currentPresetKey,
  }
}
