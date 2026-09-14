declare module 'butterchurn' {
  interface ButterchurnVisualizerOptions {
    width?: number
    height?: number
    pixelRatio?: number
    textureRatio?: number
  }

  interface ButterchurnVisualizer {
    connectAudio(audioNode: AudioNode): void
    disconnectAudio(audioNode: AudioNode): void
    loadPreset(preset: unknown, blendTime?: number): void
    setRendererSize(width: number, height: number): void
    render(): void
  }

  const butterchurn: {
    createVisualizer(
      context: AudioContext,
      canvas: HTMLCanvasElement,
      opts?: ButterchurnVisualizerOptions,
    ): ButterchurnVisualizer
  }

  export default butterchurn
}

declare module 'butterchurn-presets' {
  // Static-only class: `ButterchurnPresets.getPresets()` returns the preset map.
  class ButterchurnPresets {
    static getPresets(): Record<string, unknown>
  }
  export default ButterchurnPresets
}
