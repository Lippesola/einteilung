<script setup>
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import PersonCard from './PersonCard.vue';
import { store, ui, removeBlock } from '../model/state.js';
import { summarize } from '../model/stats.js';

const props = defineProps({
  block: { type: Object, required: true },
  group: { type: Object, required: true },
  index: { type: Number, default: 0 },
  special: Boolean,
});

const stats = computed(() => summarize(props.block.participants.map((id) => store.people[id]).filter(Boolean)));
const canRemove = computed(() => !props.special && props.block.participants.length === 0 && props.group.blocks.length > 1);
</script>

<template>
  <div class="block">
    <div class="block-head">
      <span v-if="!special" class="block-handle" title="Block verschieben"><AppIcon name="grip" /></span>
      <div class="block-stats">
        <strong v-if="!special">Block {{ index + 1 }}</strong>
        <strong v-else-if="group.blocks.length > 1">Ohne Block</strong>
        <span>{{ stats.count }} TN</span>
        <small v-if="stats.hasSex">{{ stats.m }} m / {{ stats.f }} w</small>
        <small v-if="stats.avg !== null">Ø {{ stats.avg.toFixed(2) }} J.</small>
      </div>
      <button v-if="canRemove" class="btn icon" title="Leeren Block entfernen" @click="removeBlock(group, block)"><AppIcon name="xmark" :size="14" /></button>
    </div>
    <VueDraggable v-model="block.participants" group="tn" :animation="150" class="drop">
      <PersonCard
        v-for="id in block.participants"
        :key="id"
        :person="store.people[id]"
        @open="ui.wishPersonId = $event.id"
      />
    </VueDraggable>
  </div>
</template>
