import { ref, computed } from 'vue'

export interface PlaylistTrack {
  name: string
  file: File
}

const AUDIO_EXTENSION_RE = /\.(mp3|m4a)$/i

const tracks = ref<PlaylistTrack[]>([])
const currentIndex = ref(-1)

const currentTrack = computed<PlaylistTrack | null>(() =>
  currentIndex.value >= 0 ? (tracks.value[currentIndex.value] ?? null) : null,
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < tracks.value.length - 1,
)

/**
 * Строит плейлист из FileList, полученного через
 * <input type="file" webkitdirectory>. Берём только файлы верхнего
 * уровня выбранной папки (без вложенных подпапок) — это и есть
 * "текущая папка" в терминах обычного проводника.
 */
function setTracksFromFileList(fileList: FileList) {
  const list = Array.from(fileList).filter((file) => {
    if (!AUDIO_EXTENSION_RE.test(file.name)) return false
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    if (!relativePath) return true
    return relativePath.split('/').length === 2 // "ИмяПапки/файл.mp3"
  })

  list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  tracks.value = list.map((file) => ({ name: file.name, file }))
  currentIndex.value = tracks.value.length > 0 ? 0 : -1
}

/**
 * Строит плейлист напрямую из FileSystemDirectoryHandle (File System Access
 * API) — используется и при ручном выборе папки, и при автоматическом
 * восстановлении последней сессии.
 */
async function setTracksFromDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const found: PlaylistTrack[] = []
  for await (const [name, entryHandle] of handle.entries()) {
    if (entryHandle.kind === 'file' && AUDIO_EXTENSION_RE.test(name)) {
      const file = await (entryHandle as FileSystemFileHandle).getFile()
      found.push({ name, file })
    }
  }

  found.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  tracks.value = found
  currentIndex.value = found.length > 0 ? 0 : -1
}

function selectIndex(index: number) {
  if (index >= 0 && index < tracks.value.length) {
    currentIndex.value = index
  }
}

/** Выбрать трек по имени файла (используется при восстановлении сессии). Возвращает true, если трек найден. */
function selectIndexByName(name: string): boolean {
  const index = tracks.value.findIndex((track) => track.name === name)
  if (index >= 0) {
    currentIndex.value = index
    return true
  }
  return false
}

function next() {
  if (hasNext.value) currentIndex.value++
}

function prev() {
  if (hasPrev.value) currentIndex.value--
}

export function usePlaylist() {
  return {
    tracks,
    currentIndex,
    currentTrack,
    hasPrev,
    hasNext,
    setTracksFromFileList,
    setTracksFromDirectoryHandle,
    selectIndex,
    selectIndexByName,
    next,
    prev,
  }
}
