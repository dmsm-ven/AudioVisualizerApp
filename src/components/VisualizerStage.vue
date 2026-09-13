<script setup lang="ts">
// Пустая заглушка под будущий canvas/webgl рендер визуализации
</script>

<template>
  <main class="stage">
    <p class="placeholder">Здесь будет визуализация аудио</p>
  </main>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.placeholder {
  color: #444;
  font-family: 'Segoe UI', sans-serif;
  font-size: 1rem;
}
</style>
