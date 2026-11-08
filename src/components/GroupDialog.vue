<script setup>
import { computed, reactive } from 'vue';
import { store, ui, saveGroup, removeGroup, groupKeyTaken } from '../model/state.js';
import ConfirmButton from './ConfirmButton.vue';

const existing = ui.groupDialog.id ? store.groups.find((g) => g.id === ui.groupDialog.id) : null;
const form = reactive({
  id: existing?.id ?? null,
  kind: existing?.kind ?? 'tent',
  number: existing?.number || ui.groupDialog.number || 1,
  title: existing?.title ?? '',
  color: existing?.color || ui.groupDialog.color || '#64b5f6',
});

// The id of a group is its number (tent) or its name (infrastructure) – it has to be unique.
const problem = computed(() => {
  if (form.kind === 'tent') {
    const n = Number(form.number);
    if (!Number.isInteger(n) || n < 1) return 'Die Gruppennummer muss eine ganze Zahl ab 1 sein.';
    if (groupKeyTaken('tent', n, '', form.id)) return `Gruppe ${n} gibt es schon.`;
    return '';
  }
  const name = form.title.trim();
  if (!name) return 'Infrastruktur-Gruppen brauchen einen Namen.';
  if (/^\d+$/.test(name)) return 'Der Name darf keine reine Zahl sein (sonst wird er als Zeltgruppe gelesen).';
  if (groupKeyTaken('infra', 0, name, form.id)) return `„${name}“ gibt es schon.`;
  return '';
});

const close = () => { ui.groupDialog = null; };
function save() {
  if (problem.value) return;
  saveGroup({ ...form, title: form.title.trim(), number: form.kind === 'infra' ? 0 : Number(form.number) });
  close();
}
function remove() {
  removeGroup(form.id);
  close();
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h3>{{ form.id ? 'Gruppe bearbeiten' : 'Gruppe hinzufügen' }}</h3>
      <label>Typ
        <select v-model="form.kind">
          <option value="tent">Zeltgruppe</option>
          <option value="infra">Infrastruktur</option>
        </select>
      </label>
      <label v-if="form.kind === 'tent'">Gruppennummer<input v-model.number="form.number" type="number" min="1" /></label>
      <label>{{ form.kind === 'tent' ? 'Name (optional)' : 'Name' }}<input v-model="form.title" /></label>
      <label>Farbe<input v-model="form.color" type="color" /></label>
      <p v-if="problem" class="error">{{ problem }}</p>
      <div class="actions">
        <ConfirmButton v-if="form.id" label="Löschen" confirm-label="Wirklich löschen?" danger @confirm="remove" />
        <span class="spacer"></span>
        <button class="btn" @click="close">Abbrechen</button>
        <button class="btn primary" :disabled="!!problem" @click="save">Speichern</button>
      </div>
      <p v-if="form.id" class="muted tight">Beim Löschen landen alle Personen der Gruppe in „Nicht zugeordnet“.</p>
    </div>
  </div>
</template>
