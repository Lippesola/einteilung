<script setup>
import { ref } from 'vue';
import ColumnConfigurator from './components/ColumnConfigurator.vue';
import ImportStep from './components/ImportStep.vue';
import Board from './components/Board.vue';
import { hasData } from './model/state.js';
import { theme, toggleTheme } from './utils/theme.js';

const step = ref(hasData.value ? 'board' : 'import');
</script>

<template>
  <header class="app-header">
    <h1>Gruppeneinteilung</h1>
    <nav class="steps">
      <button :class="{ active: step === 'import' }" @click="step = 'import'">Daten laden</button>
      <button :class="{ active: step === 'board' }" :disabled="!hasData" @click="step = 'board'">Einteilung</button>
    </nav>
    <div class="header-actions">
      <button class="btn ghost" :class="{ active: step === 'config' }" @click="step = 'config'"><AppIcon name="settings" /> Spalten</button>
      <button class="btn ghost" :title="theme === 'dark' ? 'Helles Design' : 'Dunkles Design'" @click="toggleTheme">
        <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
      </button>
    </div>
  </header>
  <main>
    <ColumnConfigurator v-if="step === 'config'" @next="step = 'import'" />
    <ImportStep v-else-if="step === 'import'" @config="step = 'config'" @done="step = 'board'" />
    <Board v-else @import="step = 'import'" />
  </main>
</template>
