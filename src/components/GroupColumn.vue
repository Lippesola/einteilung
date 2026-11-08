<script setup>
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import PersonCard from './PersonCard.vue';
import BlockCard from './BlockCard.vue';
import { store, ui, hasTN, hasStaff, addBlock, groupLabel } from '../model/state.js';
import { summarize } from '../model/stats.js';

const props = defineProps({ group: { type: Object, required: true }, special: Boolean });
defineEmits(['edit']);

const tnList = computed(() => props.group.blocks.flatMap((b) => b.participants).map((id) => store.people[id]).filter(Boolean));
const maList = computed(() => props.group.staff.map((id) => store.people[id]).filter(Boolean));
const tn = computed(() => summarize(tnList.value));
const ma = computed(() => summarize(maList.value));

const blockList = computed({
  get: () => (props.special ? props.group.blocks.slice(1) : props.group.blocks),
  set: (list) => { props.group.blocks = props.special ? [props.group.blocks[0], ...list] : list; },
});

const ratio =(a, b) => (a / b).toFixed(2);
const showRatios = computed(() => tn.value.count > 0 && ma.value.count > 0);
const showBlocks = computed(() => hasTN.value && ui.showTN && (props.group.kind !== 'infra' || tn.value.count > 0));
const title = computed(() => groupLabel(props.group) || 'Ohne Namen');
</script>

<template>
  <div class="column">
    <div class="card" :style="{ borderTopColor: group.color || '#bdbdbd' }">
      <div class="card-head">
        <span class="g-title">{{ title }}</span>
        <button v-if="ui.groupEdit && !special" class="btn icon" title="Gruppe bearbeiten" @click="$emit('edit', group)"><AppIcon name="pen" :size="15" /></button>
      </div>

      <div v-if="!special && (tn.count || ma.count)" class="stats">
        <div v-if="tn.count">
          <strong>{{ tn.count }} TN</strong>
          <small v-if="tn.hasSex">{{ tn.m }} m / {{ tn.f }} w</small>
          <small v-if="tn.avg !== null">{{ tn.avg.toFixed(2) }} Jahre</small>
        </div>
        <div v-if="ma.count">
          <strong>{{ ma.count }} MA</strong>
          <small v-if="ma.hasSex">{{ ma.m }} m / {{ ma.f }} w</small>
          <small v-if="ma.avg !== null">{{ ma.avg.toFixed(2) }} Jahre</small>
        </div>
        <div v-if="showRatios" class="ratios">
          <small>{{ ratio(tn.count, ma.count) }} TN pro MA</small>
          <small v-if="tn.m && ma.m"><AppIcon name="mars" :size="13" class="sex-m" /> {{ ratio(tn.m, ma.m) }}</small>
          <small v-if="tn.f && ma.f"><AppIcon name="venus" :size="13" class="sex-f" /> {{ ratio(tn.f, ma.f) }}</small>
        </div>
      </div>

      <template v-if="hasStaff">
        <div class="section-title">Mitarbeiter</div>
        <VueDraggable v-model="group.staff" group="staff" :animation="150" class="drop">
          <PersonCard v-for="id in group.staff" :key="id" :person="store.people[id]" />
        </VueDraggable>
      </template>

      <template v-if="showBlocks">
        <div class="section-title">Teilnehmer</div>
        <!-- "Nicht zugeordnet": blocks[0] is the pool of loose participants, the rest are movable wish blocks. -->
        <BlockCard v-if="special" :block="group.blocks[0]" :group="group" special />
        <VueDraggable v-model="blockList" group="blocks" handle=".block-handle" :animation="150" class="blocks">
          <BlockCard v-for="(b, i) in blockList" :key="b.id" :block="b" :group="group" :index="i" />
        </VueDraggable>
        <button class="btn small" @click="addBlock(group)"><AppIcon name="plus" :size="14" /> Block</button>
      </template>
    </div>
  </div>
</template>
