<script setup>
import { computed, reactive, ref } from 'vue';
import { parseCsv, buildData, sampleCsv, sampleGroupsCsv } from '../model/csv.js';
import { guessField, uid } from '../model/fields.js';
import { store, hasData, applyImport } from '../model/state.js';
import { readFileText, downloadText } from '../utils/download.js';
import FileSlot from './FileSlot.vue';
import ConfirmButton from './ConfirmButton.vue';

const emit = defineEmits(['config', 'done']);

// Keyed access: refs would be auto-unwrapped when passed from the template.
const files = reactive({
  people: { name: '', text: '' },
  groups: { name: '', text: '' },
});
const parsed = ref(null);
const result = ref(null);
const error = ref('');

function process() {
  error.value = '';
  parsed.value = null;
  result.value = null;
  if (!files.people.text) return;
  try {
    const p = parseCsv(files.people.text, store.config.delimiter);
    if (!p.headers.length || !p.rows.length) {
      error.value = 'Die Personen-Datei enthält keine Datenzeilen.';
      return;
    }
    const g = files.groups.text ? parseCsv(files.groups.text, store.config.delimiter) : null;
    parsed.value = p;
    result.value = buildData(p.headers, p.rows, store.config, g);
  } catch (e) {
    error.value = 'Die Datei konnte nicht gelesen werden: ' + e.message;
  }
}

async function load(key, file) {
  if (!file) return;
  try {
    files[key] = { name: file.name, text: await readFileText(file) };
  } catch (e) {
    error.value = 'Die Datei konnte nicht gelesen werden: ' + e.message;
    return;
  }
  process();
}
function clear(key) {
  files[key] = { name: '', text: '' };
  process();
}
function tryExample() {
  files.people = { name: 'beispiel (Muster)', text: sampleCsv(store.config) };
  files.groups = { name: 'beispiel-gruppen (Muster)', text: sampleGroupsCsv(store.config) };
  process();
}

const nothingMatched = computed(() => result.value && result.value.info.matched.length === 0);
const previewRows = computed(() => parsed.value?.rows.slice(0, 5) ?? []);
const issueCount = computed(() => (result.value?.warnings.length ?? 0) + (result.value?.info.unmatched.length ? 1 : 0));

function deriveConfig() {
  store.config.columns = parsed.value.headers.map((h) => ({ id: uid('c'), header: h, field: guessField(h) }));
  process();
}
function accept() {
  applyImport(result.value, parsed.value.headers, files.people.name);
  emit('done');
}
</script>

<template>
  <section class="page">
    <h2>Daten laden</h2>
    <p class="muted">
      Lade die Personen-CSV mit Teilnehmern und Mitarbeitern. Eine Gruppen-CSV ist optional – sie liefert Namen und Farben der Gruppen.
      Enthält die Personen-CSV schon Gruppen, wird die Einteilung wiederhergestellt.
    </p>

    <div v-if="hasData" class="callout">
      <span>Es gibt noch einen gespeicherten Stand{{ store.fileName ? ` (${store.fileName})` : '' }}.</span>
      <button class="btn primary" @click="emit('done')">Weiterarbeiten →</button>
    </div>

    <div class="slots">
      <FileSlot
        title="Personen"
        hint="Teilnehmer und Mitarbeiter, eine Zeile pro Person."
        :file-name="files.people.name"
        @file="load('people', $event)"
        @clear="clear('people')"
      />
      <FileSlot
        title="Gruppen"
        hint="Eine Zeile pro Gruppe: Nr. oder Name, Name, Farbe."
        optional
        :file-name="files.groups.name"
        @file="load('groups', $event)"
        @clear="clear('groups')"
      />
    </div>

    <p v-if="!files.people.name" class="start-links">
      <button class="link" @click="tryExample">Mit Beispieldaten ausprobieren</button>
      ·
      <button class="link" @click="emit('config')">Spalten anpassen / Muster herunterladen</button>
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="result" class="panel">
      <div class="chips">
        <span class="chip"><strong>{{ result.info.tn }}</strong> Teilnehmer</span>
        <span class="chip"><strong>{{ result.info.ma }}</strong> Mitarbeiter</span>
        <span class="chip"><strong>{{ result.info.groups }}</strong> Gruppen</span>
        <span v-if="issueCount" class="chip warn">{{ issueCount }} Hinweis{{ issueCount === 1 ? '' : 'e' }}</span>
      </div>

      <p v-if="nothingMatched" class="error">
        Keine Spalte passt zur Konfiguration.
        <button class="btn" @click="deriveConfig">Konfiguration aus den CSV-Spalten ableiten</button>
      </p>

      <details>
        <summary>Details und Vorschau</summary>
        <p v-if="result.info.unmatched.length" class="muted">
          Nicht zugeordnete Spalten (werden beim Export unverändert durchgereicht): {{ result.info.unmatched.join(', ') }}
        </p>
        <p v-if="result.info.missing.length && !nothingMatched" class="muted">
          Konfiguriert, aber nicht in der Datei (wird ignoriert): {{ result.info.missing.join(', ') }}
        </p>
        <ul v-if="result.warnings.length" class="hints">
          <li v-for="w in result.warnings.slice(0, 15)" :key="w">{{ w }}</li>
          <li v-if="result.warnings.length > 15">… und {{ result.warnings.length - 15 }} weitere</li>
        </ul>
        <div class="table-wrap">
          <table>
            <thead><tr><th v-for="h in parsed.headers" :key="h">{{ h }}</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in previewRows" :key="i"><td v-for="h in parsed.headers" :key="h">{{ r[h] }}</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="actions">
        <span class="spacer"></span>
        <ConfirmButton v-if="hasData" label="Importieren (ersetzt gespeicherten Stand)" confirm-label="Wirklich ersetzen?" @confirm="accept" />
        <button v-else class="btn primary" @click="accept">Einteilung starten →</button>
      </div>
    </div>
  </section>
</template>
