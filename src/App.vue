<script setup>
import { ref } from 'vue';
import ColumnConfigurator from './components/ColumnConfigurator.vue';
import ImportStep from './components/ImportStep.vue';
import Board from './components/Board.vue';
import LegalPage from './components/LegalPage.vue';
import { hasData } from './model/state.js';
import { theme, toggleTheme } from './utils/theme.js';

const step = ref(hasData.value ? 'board' : 'import');
const legal = ref(null); // 'impressum' | 'datenschutz' | null
const showStep = (s) => { legal.value = null; step.value = s; };
</script>

<template>
  <header class="app-header">
    <h1>Gruppeneinteilung</h1>
    <nav class="steps">
      <button :class="{ active: !legal && step === 'import' }" @click="showStep('import')">Daten laden</button>
      <button :class="{ active: !legal && step === 'board' }" :disabled="!hasData" @click="showStep('board')">Einteilung</button>
    </nav>
    <div class="header-actions">
      <button class="btn ghost" :class="{ active: step === 'config' }" @click="showStep('config')"><AppIcon name="settings" /> Spalten</button>
      <button class="btn ghost" :title="theme === 'dark' ? 'Helles Design' : 'Dunkles Design'" @click="toggleTheme">
        <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
      </button>
    </div>
  </header>
  <main>
    <LegalPage v-if="legal" :page="legal" @back="legal = null" />
    <ColumnConfigurator v-else-if="step === 'config'" @next="step = 'import'" />
    <ImportStep v-else-if="step === 'import'" @config="step = 'config'" @done="step = 'board'" />
    <Board v-else @import="step = 'import'" />
  </main>
  <footer class="app-footer">
    <a href="#" @click.prevent="legal = 'impressum'">Impressum</a>
    <a href="#" @click.prevent="legal = 'datenschutz'">Datenschutz</a>
    <a href="https://github.com/lippesola/einteilung" target="_blank" rel="noopener">GitHub</a>
  </footer>
</template>
