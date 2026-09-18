<script setup lang="ts">
import { onMounted } from 'vue'
import TopMenu from './components/TopMenu.vue'
import VisualizerStage from './components/VisualizerStage.vue'
import { useAppPersistence } from './composables/useAppPersistence'

const { needsRestoreConfirmation, isRestoring, init, confirmRestore, dismissRestore } =
  useAppPersistence()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="app-shell">
    <TopMenu />

    <div v-if="needsRestoreConfirmation" class="restore-banner">
      <span class="restore-text">Восстановить последнюю сессию (папка и трек)?</span>
      <div class="restore-actions">
        <button class="restore-btn confirm" type="button" :disabled="isRestoring" @click="confirmRestore">
          {{ isRestoring ? 'Восстановление…' : 'Продолжить' }}
        </button>
        <button class="restore-btn dismiss" type="button" :disabled="isRestoring" @click="dismissRestore">
          Не сейчас
        </button>
      </div>
    </div>

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

.restore-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 14px;
  background: #23232a;
  border-bottom: 1px solid #3a3a40;
  color: #e6e6e6;
  font-family: 'Segoe UI', sans-serif;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.restore-actions {
  display: flex;
  gap: 8px;
}

.restore-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #3a3a40;
  cursor: pointer;
  font-size: 0.85rem;
  background: #2a2a2e;
  color: #e6e6e6;
}

.restore-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.restore-btn.confirm {
  color: #7fffa1;
  border-color: #3f5c46;
}

.restore-btn.dismiss {
  color: #ccc;
}
</style>
