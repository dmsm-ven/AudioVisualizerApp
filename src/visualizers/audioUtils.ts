/**
 * Средняя "громкость" (0..1) в заданном диапазоне частотного спектра.
 * fromRatio/toRatio — доля от общего числа бинов (0 = самые низкие частоты, 1 = самые высокие).
 */
export function bandEnergy(data: Uint8Array, fromRatio: number, toRatio: number): number {
  const from = Math.floor(data.length * fromRatio)
  const to = Math.max(from + 1, Math.floor(data.length * toRatio))
  let sum = 0
  for (let i = from; i < to; i++) {
    sum += data[i] ?? 0
  }
  return sum / (to - from) / 255
}
