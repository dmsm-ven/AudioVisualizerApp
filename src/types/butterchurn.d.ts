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
  // The package's default export IS the presets-map factory function itself
  // (not an object with a getPresets method).
  const getPresets: () => Record<string, unknown>
  export default getPresets
}
