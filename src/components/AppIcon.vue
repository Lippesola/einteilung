<script setup>
import { computed } from 'vue';
import { iconRegistry, fallbackIcon } from '../utils/icons.js';

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 2 },
  fill: { type: String, default: 'none' },
});

const resolved = computed(() => {
  const icon = iconRegistry[props.name];
  if (!icon && import.meta.env.DEV) console.warn(`[AppIcon] unbekanntes Icon: "${props.name}"`);
  return icon || fallbackIcon;
});
</script>

<template>
  <component :is="resolved" class="icon" :size="size" :stroke-width="strokeWidth" :fill="fill" />
</template>
