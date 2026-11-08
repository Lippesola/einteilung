import { reactive, computed, watch } from 'vue';
import { defaultConfig, sanitizeConfig, uid, GROUP_PALETTE } from './fields.js';
import { makeUnassigned } from './csv.js';
import { computeWishInfo } from './wishes.js';
import { clusterByWishes } from './autosort.js';

const KEY_CONFIG = 'einteilung.config.v1';
const KEY_WORK = 'einteilung.work.v1';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export const store = reactive({
  config: sanitizeConfig(read(KEY_CONFIG)),
  people: {},
  groups: [],
  unassigned: makeUnassigned(),
  importedHeaders: [],
  fileName: '',
});

export const ui = reactive({
  search: '',
  showTN: true,
  groupEdit: false,
  wishPersonId: null,
  groupDialog: null, // { id: string|null }
});

const work = read(KEY_WORK);
if (work && work.people) {
  store.people = work.people;
  store.groups = work.groups || [];
  store.unassigned = work.unassigned || makeUnassigned();
  store.importedHeaders = work.importedHeaders || [];
  store.fileName = work.fileName || '';
}

// Anyone who is not part of any group/block ends up in "Nicht zugeordnet".
export function repair() {
  const seen = new Set();
  for (const g of [store.unassigned, ...store.groups]) {
    g.staff.forEach((id) => seen.add(id));
    g.blocks.forEach((b) => b.participants.forEach((id) => seen.add(id)));
  }
  for (const p of Object.values(store.people)) {
    if (seen.has(p.id)) continue;
    if (p.type === 'MA') store.unassigned.staff.push(p.id);
    else store.unassigned.blocks[0].participants.push(p.id);
  }
}
repair();

let timer = null;
function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Speichern im Browser nicht möglich', e);
  }
}
watch(() => store.config, () => persist(KEY_CONFIG, store.config), { deep: true });
watch(
  () => [store.people, store.groups, store.unassigned, store.importedHeaders, store.fileName],
  () => {
    clearTimeout(timer);
    timer = setTimeout(() => persist(KEY_WORK, {
      people: store.people,
      groups: store.groups,
      unassigned: store.unassigned,
      importedHeaders: store.importedHeaders,
      fileName: store.fileName,
    }), 300);
  },
  { deep: true },
);

export const hasData = computed(() => Object.keys(store.people).length > 0);
export const hasTN = computed(() => Object.values(store.people).some((p) => p.type === 'TN'));
export const hasStaff = computed(() => Object.values(store.people).some((p) => p.type === 'MA'));
export const hasWishes = computed(() => store.config.columns.some((c) => /^wish[1-5]$/.test(c.field)));

export const locations = computed(() => {
  const loc = {};
  for (const g of [store.unassigned, ...store.groups]) {
    g.staff.forEach((id) => { loc[id] = { groupId: g.id, blockId: null }; });
    g.blocks.forEach((b) => b.participants.forEach((id) => { loc[id] = { groupId: g.id, blockId: b.id }; }));
  }
  return loc;
});

export const wishInfo = computed(() => computeWishInfo(store.people, locations.value));

export function groupLabel(group) {
  if (!group) return '';
  return (group.number ? `Gruppe ${group.number}` : '') + (group.number && group.title ? ' – ' : '') + group.title;
}

export function findGroup(id) {
  return id === 'unassigned' ? store.unassigned : store.groups.find((g) => g.id === id);
}

export function applyImport(result, headers, fileName) {
  store.people = result.people;
  store.groups = result.groups;
  store.unassigned = result.unassigned;
  store.importedHeaders = headers;
  store.fileName = fileName;
  repair();
}

export function resetWork() {
  store.people = {};
  store.groups = [];
  store.unassigned = makeUnassigned();
  store.importedHeaders = [];
  store.fileName = '';
  try { localStorage.removeItem(KEY_WORK); } catch { /* ignore */ }
}

export function resetConfig() {
  // Mutate in place: components hold a reference to store.config.
  Object.assign(store.config, defaultConfig());
}

function sortGroups() {
  store.groups.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'tent' ? -1 : 1) || a.number - b.number || a.title.localeCompare(b.title));
}

export function saveGroup(form) {
  const kindChanged = (g) => g.kind !== form.kind;
  if (form.id) {
    const g = store.groups.find((x) => x.id === form.id);
    if (!g) return;
    const changed = kindChanged(g);
    Object.assign(g, { number: form.number, title: form.title, color: form.color, kind: form.kind });
    if (changed && g.kind === 'tent' && g.blocks.length === 0) g.blocks.push({ id: uid('b'), participants: [] });
  } else {
    store.groups.push({
      id: uid('g'),
      number: form.number,
      title: form.title,
      color: form.color,
      kind: form.kind,
      staff: [],
      blocks: [{ id: uid('b'), participants: [] }],
    });
  }
  sortGroups();
}

// Group ids must be unique: the number for tent groups, the name for infrastructure groups.
export function groupKeyTaken(kind, number, title, exceptId) {
  const name = String(title).trim().toLowerCase();
  return store.groups.some((g) => g.id !== exceptId && g.kind === kind && (kind === 'tent' ? g.number === number : g.title.trim().toLowerCase() === name));
}

export function removeGroup(id) {
  const idx = store.groups.findIndex((g) => g.id === id);
  if (idx < 0) return;
  const g = store.groups[idx];
  store.unassigned.staff.push(...g.staff);
  store.unassigned.blocks[0].participants.push(...g.blocks.flatMap((b) => b.participants));
  store.groups.splice(idx, 1);
}

export function nextGroupDefaults() {
  const max = Math.max(0, ...store.groups.filter((g) => g.kind === 'tent').map((g) => g.number));
  return { number: max + 1, color: GROUP_PALETTE[store.groups.length % GROUP_PALETTE.length] };
}

// Builds wish blocks from the participants in "Nicht zugeordnet".
// blocks[0] stays the pool of loose participants, every further block is one wish cluster.
export function autoSortWishes() {
  const u = store.unassigned;
  const ids = u.blocks.flatMap((b) => b.participants);
  const { clusters, singles } = clusterByWishes(store.people, ids);
  u.blocks = [
    { id: u.blocks[0].id, participants: singles },
    ...clusters.map((c) => ({ id: uid('b'), participants: c })),
  ];
  return {
    blocks: clusters.length,
    grouped: clusters.reduce((n, c) => n + c.length, 0),
    largest: clusters.length ? clusters[0].length : 0,
    singles: singles.length,
  };
}

export const hasManualUnassignedBlocks = computed(() => store.unassigned.blocks.slice(1).some((b) => b.participants.length));

export function addBlock(group) {
  group.blocks.push({ id: uid('b'), participants: [] });
}

export function removeBlock(group, block) {
  if (block.participants.length || group.blocks.length <= 1) return;
  group.blocks.splice(group.blocks.indexOf(block), 1);
}
