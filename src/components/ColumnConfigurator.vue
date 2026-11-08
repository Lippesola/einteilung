<script setup>
import { computed, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { FIELDS, COLORS, SCALE_FIELDS, SCALE_TITLES, PASSTHROUGH_LABEL, uid, sanitizeConfig } from '../model/fields.js';
import { sampleCsv, sampleGroupsCsv } from '../model/csv.js';
import { store, resetConfig } from '../model/state.js';
import { downloadText, readFileText } from '../utils/download.js';
import ConfirmButton from './ConfirmButton.vue';
import Menu from './Menu.vue';

defineEmits(['next']);

const cfg = store.config;
const error = ref('');
const colorNames = Object.keys(COLORS);

const hints = computed(() => {
  const list = [];
  const fields = cfg.columns.map((c) => c.field);
  if (!fields.includes('firstName') && !fields.includes('lastName')) list.push('Ohne Vor- oder Nachname sind Personen schwer unterscheidbar.');
  if (!fields.includes('type')) list.push('Ohne „Typ“-Spalte gelten alle als Teilnehmer.');
  const seen = new Set();
  for (const c of cfg.columns) {
    const f = FIELDS.find((x) => x.key === c.field);
    if (c.field && !f?.repeatable && seen.has(c.field)) list.push(`„${f?.label}“ ist mehrfach zugeordnet – nur die erste Spalte zählt.`);
    seen.add(c.field);
  }
  const headers = cfg.columns.map((c) => c.header.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) list.push('Spaltennamen sollten eindeutig sein.');
  return list;
});

const addColumn = () => cfg.columns.push({ id: uid('c'), header: '', field: '' });
const removeColumn = (i) => cfg.columns.splice(i, 1);
const addScaleOption = (key) => cfg.scales[key].push({ value: String(cfg.scales[key].length), label: '', color: 'grey' });

const downloadPeopleSample = () => downloadText('muster-personen.csv', sampleCsv(cfg));
const downloadGroupSample = () => downloadText('muster-gruppen.csv', sampleGroupsCsv(cfg));
const downloadConfig = () => downloadText('einteilung-konfiguration.json', JSON.stringify(cfg, null, 2), 'application/json');

async function loadConfig(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    Object.assign(cfg, sanitizeConfig(JSON.parse(await readFileText(file))));
    error.value = '';
  } catch {
    error.value = 'Die Konfigurationsdatei konnte nicht gelesen werden.';
  }
}
</script>

<template>
  <section class="page">
    <h2>Spalten festlegen</h2>
    <p class="muted">
      Welche Spalten hat deine Personen-CSV? Alles ist optional – was fehlt, wird nicht angezeigt.
      Spalten ohne Bedeutung bleiben beim Export unverändert erhalten.
    </p>

    <div class="panel">
      <div class="panel-head">
        <h3>Personen-CSV</h3>
        <label class="inline">Trennzeichen
          <select v-model="cfg.delimiter">
            <option value=";">Semikolon ( ; )</option>
            <option value=",">Komma ( , )</option>
            <option value="&#9;">Tabulator</option>
            <option value="auto">Automatisch (Export: ;)</option>
          </select>
        </label>
      </div>

      <div class="col-head"><span></span><span>Spaltenname in der CSV</span><span>Bedeutung</span><span></span></div>
      <VueDraggable v-model="cfg.columns" handle=".handle" :animation="150" class="cols">
        <div v-for="(c, i) in cfg.columns" :key="c.id" class="col-row">
          <span class="handle" title="Reihenfolge ändern"><AppIcon name="grip" /></span>
          <input v-model="c.header" placeholder="Spaltenname" />
          <select v-model="c.field">
            <option value="">{{ PASSTHROUGH_LABEL }}</option>
            <option v-for="f in FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <button class="btn icon" title="Spalte entfernen" @click="removeColumn(i)"><AppIcon name="xmark" :size="15" /></button>
        </div>
      </VueDraggable>
      <button class="btn small" @click="addColumn"><AppIcon name="plus" :size="14" /> Spalte</button>
      <p class="muted tight">
        „Gruppe“ enthält bei Zeltgruppen die Nummer (<code>3</code>), bei Infrastruktur den Namen (<code>Küche</code>).
      </p>

      <ul v-if="hints.length" class="hints">
        <li v-for="h in hints" :key="h">{{ h }}</li>
      </ul>
    </div>

    <details class="panel">
      <summary>Gruppen-CSV (optional)</summary>
      <p class="muted">
        Eine Zeile pro Gruppe. Die Personen-CSV verweist nur auf die Gruppe, Name und Farbe stehen einmal hier. Zeltgruppen:
        Nummer als Gruppe, Infrastruktur: der Name ist die Gruppe (Spalte „Name“ bleibt leer).
      </p>
      <div class="grid3">
        <label>Spalte „Gruppe“<input v-model="cfg.groupFile.id" /></label>
        <label>Spalte „Name“<input v-model="cfg.groupFile.name" /></label>
        <label>Spalte „Farbe“<input v-model="cfg.groupFile.color" /></label>
      </div>
    </details>

    <details class="panel">
      <summary>Werte und Skalen</summary>
      <p class="muted">Komma-getrennte Listen, Groß-/Kleinschreibung egal.</p>
      <div class="grid2">
        <label>Teilnehmer<input v-model="cfg.values.tn" /></label>
        <label>Mitarbeiter<input v-model="cfg.values.ma" /></label>
        <label>Männlich<input v-model="cfg.values.male" /></label>
        <label>Weiblich<input v-model="cfg.values.female" /></label>
        <label>Gruppenleiter (Wert „wahr“)<input v-model="cfg.values.leaderTrue" /></label>
      </div>
      <div v-for="key in SCALE_FIELDS" :key="key" class="scale">
        <h4>Skala: {{ SCALE_TITLES[key] }}</h4>
        <p class="muted tight">Was bedeuten die Zahlen? Die Beschriftung wird an der Person angezeigt.</p>
        <div v-for="(o, i) in cfg.scales[key]" :key="i" class="scale-row">
          <input v-model="o.value" class="narrow" placeholder="Wert" />
          <input v-model="o.label" placeholder="Beschriftung" />
          <select v-model="o.color">
            <option v-for="n in colorNames" :key="n" :value="n">{{ n }}</option>
          </select>
          <span class="dot" :style="{ background: COLORS[o.color] }"></span>
          <button class="btn icon" @click="cfg.scales[key].splice(i, 1)"><AppIcon name="xmark" :size="15" /></button>
        </div>
        <button class="btn small" @click="addScaleOption(key)"><AppIcon name="plus" :size="14" /> Stufe</button>
      </div>
    </details>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="actions">
      <Menu label="Muster herunterladen">
        <button class="menu-item" @click="downloadPeopleSample">Personen-CSV</button>
        <button class="menu-item" @click="downloadGroupSample">Gruppen-CSV</button>
      </Menu>
      <Menu label="Konfiguration">
        <button class="menu-item" @click="downloadConfig">Als JSON speichern</button>
        <label class="menu-item">JSON laden<input type="file" accept=".json,application/json" hidden @change="loadConfig" /></label>
        <div class="menu-item" @click.stop><ConfirmButton label="Auf Standard zurücksetzen" @confirm="resetConfig" /></div>
      </Menu>
      <span class="spacer"></span>
      <button class="btn primary" @click="$emit('next')">Fertig →</button>
    </div>
  </section>
</template>
