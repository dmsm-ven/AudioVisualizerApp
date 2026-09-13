<script setup lang="ts">
import TopMenu from './components/TopMenu.vue'
import VisualizerStage from './components/VisualizerStage.vue'
</script>

<template>
  <div class="app-shell">
    <TopMenu />
    <VisualizerStage />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}
</style>
