<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({ label: String, primary: Boolean, align: { type: String, default: 'right' } });

const open = ref(false);
const root = ref(null);
const onOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) open.value = false;
};
onMounted(() => document.addEventListener('mousedown', onOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside));
</script>

<template>
  <div ref="root" class="menu">
    <button type="button" class="btn" :class="{ primary }" @click="open = !open">
      <slot name="label">{{ label }}</slot><AppIcon name="chevron-down" :size="14" class="caret" />
    </button>
    <div v-if="open" class="menu-panel" :class="align" @click="open = false">
      <slot />
    </div>
  </div>
</template>
