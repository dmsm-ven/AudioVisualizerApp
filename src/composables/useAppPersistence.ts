import { ref, watch } from 'vue'
import { useAudioPlayer } from './useAudioPlayer'
import { usePlaylist } from './usePlaylist'
import { useVisualizerSelection } from './useVisualizerSelection'
import { useButterchurnSettings } from './useButterchurnSettings'
import { useCustomPresetSettings } from './useCustomPresetSettings'
import { useCanvasFilters } from './useCanvasFilters'
import {
  saveDirectoryHandle,
  loadDirectoryHandle,
  clearDirectoryHandle,
} from '../utils/directoryHandleStore'

const STORAGE_KEY = 'audio-visualizer:settings-v1'

interface PersistedSettings {
  selectedVisualizer?: string
  selectedCustomPreset?: string
  isRandomOrder?: boolean
  presetCycleSeconds?: number
  selectedPresetKey?: string | null
  volumePercent?: number
  filters?: {
    enabled?: Record<string, boolean>
    values?: Record<string, number>
  }
  lastTrackName?: string | null
  lastPositionSeconds?: number
}

export const supportsFileSystemAccess =
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

// Показать пользователю плашку "восстановить сессию?" (когда для авто-восстановления
// нужен явный жест пользователя — браузер не даёт запросить доступ к файлам молча)
const needsRestoreConfirmation = ref(false)
const isRestoring = ref(false)

let pendingHandle: FileSystemDirectoryHandle | null = null
let pendingTrackName: string | null = null
let pendingPosition = 0

function readSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedSettings) : {}
  } catch {
    return {}
  }
}

function writeSettings(patch: Partial<PersistedSettings>) {
  try {
    const current = readSettings()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }))
  } catch {
    // localStorage недоступен (приватный режим, квота и т.п.) — просто не сохраняем
  }
}

/** Запомнить папку, которую пользователь только что выбрал вручную. */
export async function rememberDirectory(handle: FileSystemDirectoryHandle) {
  if (!supportsFileSystemAccess) return
  await saveDirectoryHandle(handle).catch(() => {})
}

export function useAppPersistence() {
  const { volumePercent, currentTime, trackTitle, loadFile, seekOnceReady } = useAudioPlayer()
  const { currentTrack, selectIndexByName, setTracksFromDirectoryHandle } = usePlaylist()
  const { selectedVisualizer } = useVisualizerSelection()
  const { isRandomOrder, presetCycleSeconds, selectedPresetKey } = useButterchurnSettings()
  const { selectedCustomPreset } = useCustomPresetSettings()
  const { enabledMap, valueMap } = useCanvasFilters()

  function saveSimpleSettings() {
    writeSettings({
      selectedVisualizer: selectedVisualizer.value,
      selectedCustomPreset: selectedCustomPreset.value,
      isRandomOrder: isRandomOrder.value,
      presetCycleSeconds: presetCycleSeconds.value,
      selectedPresetKey: selectedPresetKey.value,
      volumePercent: volumePercent.value,
      filters: {
        enabled: { ...enabledMap },
        values: { ...valueMap },
      },
    })
  }

  function saveTrackProgress() {
    if (currentTrack.value) {
      writeSettings({
        lastTrackName: currentTrack.value.name,
        lastPositionSeconds: currentTime.value,
      })
    }
  }

  function applySimpleSettings(s: PersistedSettings) {
    if (s.selectedVisualizer) selectedVisualizer.value = s.selectedVisualizer
    if (s.selectedCustomPreset) selectedCustomPreset.value = s.selectedCustomPreset
    if (typeof s.isRandomOrder === 'boolean') isRandomOrder.value = s.isRandomOrder
    if (typeof s.presetCycleSeconds === 'number') presetCycleSeconds.value = s.presetCycleSeconds
    if (s.selectedPresetKey) selectedPresetKey.value = s.selectedPresetKey
    if (typeof s.volumePercent === 'number') volumePercent.value = s.volumePercent

    if (s.filters?.enabled) {
      for (const [key, value] of Object.entries(s.filters.enabled)) {
        if (key in enabledMap) enabledMap[key] = value
      }
    }
    if (s.filters?.values) {
      for (const [key, value] of Object.entries(s.filters.values)) {
        if (key in valueMap) valueMap[key] = value
      }
    }
  }

  async function restoreFolderAndTrack(
    handle: FileSystemDirectoryHandle,
    trackName: string | null,
    position: number,
  ) {
    await setTracksFromDirectoryHandle(handle)
    if (trackName) {
      selectIndexByName(trackName)
    }
    if (currentTrack.value) {
      // Восстанавливаем без автовоспроизведения — браузеры всё равно
      // заблокируют автостарт звука без явного жеста пользователя,
      // так что просто подгружаем трек и выставляем позицию, а Play
      // пользователь нажмёт сам.
      loadFile(currentTrack.value.file, { autoplay: false })
      if (position > 0) {
        seekOnceReady(position)
      }
    }
  }

  /** Вызывается один раз при старте приложения. */
  async function init() {
    const saved = readSettings()
    applySimpleSettings(saved)

    if (!supportsFileSystemAccess) return

    const handle = await loadDirectoryHandle().catch(() => null)
    if (!handle) return

    pendingHandle = handle
    pendingTrackName = saved.lastTrackName ?? null
    pendingPosition = saved.lastPositionSeconds ?? 0

    const permission = await handle.queryPermission({ mode: 'read' }).catch(() => 'prompt' as PermissionState)

    if (permission === 'granted') {
      isRestoring.value = true
      await restoreFolderAndTrack(handle, pendingTrackName, pendingPosition)
      isRestoring.value = false
      pendingHandle = null
    } else {
      // Доступ нужно подтвердить явным кликом — покажем плашку
      needsRestoreConfirmation.value = true
    }
  }

  /** Пользователь нажал "Восстановить последнюю сессию". */
  async function confirmRestore() {
    if (!pendingHandle) {
      needsRestoreConfirmation.value = false
      return
    }
    isRestoring.value = true
    try {
      const permission = await pendingHandle.requestPermission({ mode: 'read' })
      if (permission === 'granted') {
        await restoreFolderAndTrack(pendingHandle, pendingTrackName, pendingPosition)
      } else {
        await clearDirectoryHandle().catch(() => {})
      }
    } finally {
      isRestoring.value = false
      needsRestoreConfirmation.value = false
      pendingHandle = null
    }
  }

  function dismissRestore() {
    needsRestoreConfirmation.value = false
    pendingHandle = null
  }

  // Автосохранение простых настроек при любом изменении
  watch(
    [
      selectedVisualizer,
      selectedCustomPreset,
      isRandomOrder,
      presetCycleSeconds,
      selectedPresetKey,
      volumePercent,
    ],
    saveSimpleSettings,
  )
  watch(enabledMap, saveSimpleSettings, { deep: true })
  watch(valueMap, saveSimpleSettings, { deep: true })

  // Позиция воспроизведения — сохраняем не на каждый tick, а раз в ~3 секунды
  let lastProgressSaveAt = 0
  watch(currentTime, () => {
    const now = Date.now()
    if (now - lastProgressSaveAt > 3000) {
      lastProgressSaveAt = now
      saveTrackProgress()
    }
  })
  watch(trackTitle, saveTrackProgress)

  return {
    supportsFileSystemAccess,
    needsRestoreConfirmation,
    isRestoring,
    init,
    confirmRestore,
    dismissRestore,
  }
}
