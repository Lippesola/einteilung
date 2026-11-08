<script setup>
import { computed, ref } from 'vue';
import ConfirmButton from './ConfirmButton.vue';
import Menu from './Menu.vue';
import GroupColumn from './GroupColumn.vue';
import GroupDialog from './GroupDialog.vue';
import WishDialog from './WishDialog.vue';
import { store, ui, hasTN, hasWishes, nextGroupDefaults, autoSortWishes, hasManualUnassignedBlocks, resetWork } from '../model/state.js';
import { exportCsv, exportGroupsCsv, overviewCsv } from '../model/csv.js';
import { downloadText } from '../utils/download.js';

const emit = defineEmits(['import']);

const notice = ref('');
const stamp = () => new Date().toISOString().slice(0, 10);

function exportPeople() {
  const { text, addedColumns } = exportCsv(store, store.config);
  // Keep the configuration in sync so the exported file can be re-imported unchanged.
  for (const c of addedColumns) store.config.columns.push({ id: Math.random().toString(36).slice(2), header: c.header, field: c.field });
  downloadText(`einteilung-personen_${stamp()}.csv`, text);
  notice.value = addedColumns.length ? `Zur Konfiguration hinzugefügt: ${addedColumns.map((c) => c.header).join(', ')}` : '';
}
function exportGroups() {
  downloadText(`einteilung-gruppen_${stamp()}.csv`, exportGroupsCsv(store, store.config));
}
function exportBoth() {
  exportPeople();
  setTimeout(exportGroups, 300);
}
function exportOverview() {
  downloadText(`gruppenuebersicht_${stamp()}.csv`, overviewCsv(store, store.config));
}

const looseCount = computed(() => store.unassigned.blocks.reduce((n, b) => n + b.participants.length, 0));
function autoSort() {
  const r = autoSortWishes();
  notice.value = r.blocks
    ? `${r.blocks} Wunschblöcke aus ${r.grouped} Teilnehmern gebildet (größter Block: ${r.largest}). ${r.singles} ohne Wunschverbindung.`
    : 'Keine Wunschverbindungen zwischen den nicht zugeordneten Teilnehmern gefunden.';
}
function newGroup() {
  ui.groupDialog = { id: null, ...nextGroupDefaults() };
}
const editGroup = (group) => { ui.groupDialog = { id: group.id }; };
function reset() {
  resetWork();
  emit('import');
}
</script>

<template>
  <div class="board-wrap">
    <div class="toolbar">
      <input v-model="ui.search" class="search" type="search" placeholder="Person suchen …" />
      <label v-if="hasTN" class="check"><input v-model="ui.showTN" type="checkbox" /> Teilnehmer</label>

      <span class="spacer"></span>

      <template v-if="hasTN && hasWishes && looseCount">
        <ConfirmButton
          v-if="hasManualUnassignedBlocks"
          label="Wunschblöcke vorsortieren"
          confirm-label="Bestehende Blöcke neu bilden?"
          @confirm="autoSort"
        />
        <button v-else class="btn" title="Fasst nicht zugeordnete Teilnehmer, die sich gegenseitig wünschen, zu Blöcken zusammen" @click="autoSort">
          <AppIcon name="sparkles" :size="15" /> Wunschblöcke vorsortieren
        </button>
      </template>

      <button class="btn" :class="{ active: ui.groupEdit }" @click="ui.groupEdit = !ui.groupEdit">Gruppen bearbeiten</button>
      <button v-if="ui.groupEdit" class="btn" @click="newGroup"><AppIcon name="plus" :size="15" /> Gruppe</button>

      <Menu label="Exportieren" primary>
        <button class="menu-item" @click="exportBoth">Einteilung (Personen + Gruppen)</button>
        <button class="menu-item" @click="exportPeople">Nur Personen-CSV</button>
        <button class="menu-item" @click="exportGroups">Nur Gruppen-CSV</button>
        <hr />
        <button class="menu-item" @click="exportOverview">Gruppenübersicht zum Drucken</button>
      </Menu>
      <Menu>
        <template #label><AppIcon name="ellipsis" /></template>
        <button class="menu-item" @click="emit('import')">Neue Daten laden</button>
        <div class="menu-item" @click.stop><ConfirmButton label="Stand verwerfen" confirm-label="Wirklich verwerfen?" danger @confirm="reset" /></div>
      </Menu>
    </div>
    <p v-if="notice" class="notice">{{ notice }}</p>

    <div class="board">
      <GroupColumn :group="store.unassigned" special />
      <GroupColumn v-for="g in store.groups" :key="g.id" :group="g" @edit="editGroup" />
      <p v-if="!store.groups.length" class="muted empty-hint">
        Noch keine Gruppen. Über „Gruppen bearbeiten“ → „+ Gruppe“ lassen sich Gruppen anlegen.
      </p>
    </div>

    <GroupDialog v-if="ui.groupDialog" />
    <WishDialog v-if="ui.wishPersonId" />
  </div>
</template>
