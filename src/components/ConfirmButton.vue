<script setup>
import { ref, onBeforeUnmount } from 'vue';

defineProps({ label: String, confirmLabel: { type: String, default: 'Sicher?' }, danger: Boolean });
const emit = defineEmits(['confirm']);

const armed = ref(false);
let timer = null;

function click() {
  if (armed.value) {
    clearTimeout(timer);
    armed.value = false;
    emit('confirm');
    return;
  }
  armed.value = true;
  timer = setTimeout(() => { armed.value = false; }, 3000);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button type="button" class="btn" :class="{ danger: danger || armed }" @click="click">
    {{ armed ? confirmLabel : label }}
  </button>
</template>
