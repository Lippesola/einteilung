<script setup>
import { ref } from 'vue';

defineProps({ title: String, hint: String, fileName: String, optional: Boolean });
const emit = defineEmits(['file', 'clear']);

const over = ref(false);
const pick = (e) => {
  emit('file', e.target.files?.[0]);
  e.target.value = '';
};
const drop = (e) => {
  over.value = false;
  emit('file', e.dataTransfer.files?.[0]);
};
</script>

<template>
  <div class="slot" :class="{ over, filled: fileName }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
    <div class="slot-title">{{ title }} <span v-if="optional" class="badge">optional</span></div>
    <p class="muted">{{ hint }}</p>
    <template v-if="fileName">
      <div class="slot-file"><AppIcon name="check" /> {{ fileName }}</div>
      <button class="btn small" @click="emit('clear')">Entfernen</button>
    </template>
    <label v-else class="btn" :class="{ primary: !optional }">
      Datei wählen oder hierher ziehen
      <input type="file" accept=".csv,.txt,text/csv" hidden @change="pick" />
    </label>
  </div>
</template>
