<script setup>
import { computed, reactive, ref } from 'vue';
import { store, ui, wishInfo, hasWishes, findGroup, locations, groupLabel } from '../model/state.js';

const person = computed(() => store.people[ui.wishPersonId]);
const info = computed(() => wishInfo.value[ui.wishPersonId] || { wishes: [] });
const ownGroupId = computed(() => locations.value[ui.wishPersonId]?.groupId);
const editing = ref(false);

const form = reactive({
  firstName: person.value.firstName,
  lastName: person.value.lastName,
  wishes: [...person.value.wishes],
});

const close = () => { ui.wishPersonId = null; };

function toggleIgnore(w) {
  const list = person.value.ignoredWishes;
  const i = list.indexOf(w.index);
  if (i >= 0) list.splice(i, 1);
  else list.push(w.index);
}
function save() {
  person.value.firstName = form.firstName.trim();
  person.value.lastName = form.lastName.trim();
  person.value.wishes = form.wishes.map((w) => w.trim());
  editing.value = false;
}
function targetGroup(w) {
  return w.groupId === undefined ? null : findGroup(w.groupId);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal">
      <template v-if="!editing">
        <h3>
          {{ person.firstName }} {{ person.lastName }}
          <small v-if="ownGroupId && ownGroupId !== 'unassigned'" class="muted">({{ groupLabel(findGroup(ownGroupId)) }})</small>
        </h3>
        <ul v-if="hasWishes && info.wishes.length" class="wish-list">
          <li v-for="w in info.wishes" :key="w.index" :class="{ ignored: w.ignored }">
            <span class="wish-name">{{ w.name }}</span>
            <span v-if="targetGroup(w) === null" class="muted" title="Keine passende Person gefunden"><AppIcon name="question" :size="16" /></span>
            <span
              v-else
              :class="w.groupId === ownGroupId && ownGroupId !== 'unassigned' ? 'ok' : 'bad'"
              :title="'Aktuell in: ' + (groupLabel(targetGroup(w)) || 'Nicht zugeordnet')"
            >{{ targetGroup(w).number || (targetGroup(w).id === 'unassigned' ? '–' : '·') }}</span>
            <button class="btn icon" :title="w.ignored ? 'Ignorieren aufheben' : 'Ignorieren'" @click="toggleIgnore(w)"><AppIcon :name="w.ignored ? 'eye' : 'eye-slash'" :size="16" /></button>
          </li>
        </ul>
        <p v-else-if="hasWishes" class="muted">Keine Wünsche angegeben.</p>
      </template>

      <template v-else>
        <h3>Name{{ hasWishes ? ' / Wünsche' : '' }} bearbeiten</h3>
        <div class="grid2">
          <label>Vorname<input v-model="form.firstName" /></label>
          <label>Nachname<input v-model="form.lastName" /></label>
        </div>
        <template v-if="hasWishes">
          <label v-for="(_, i) in form.wishes" :key="i">Wunsch {{ i + 1 }}<input v-model="form.wishes[i]" /></label>
        </template>
      </template>

      <div class="actions">
        <button v-if="!editing" class="btn" @click="editing = true">Bearbeiten</button>
        <button v-else class="btn primary" @click="save">Speichern</button>
        <span class="spacer"></span>
        <button class="btn" @click="close">Schließen</button>
      </div>
    </div>
  </div>
</template>
