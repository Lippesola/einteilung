// Pure CSV logic (no Vue, no browser APIs) so it can be tested in Node.
import Papa from 'papaparse';
import { GROUP_FIELDS, DEFAULT_HEADERS, GROUP_PALETTE, uid } from './fields.js';
import { parseDate } from '../utils/date.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();
export const splitList = (s) => String(s || '').split(',').map(norm).filter(Boolean);

export function parseCsv(text, delimiter = ';') {
  const clean = String(text).replace(/^\uFEFF/, '');
  const res = Papa.parse(clean, {
    header: false,
    skipEmptyLines: 'greedy',
    delimiter: delimiter === 'auto' ? '' : delimiter,
  });
  const [headerRow = [], ...body] = res.data;
  const headers = headerRow.map((h) => String(h).trim());
  const rows = body.map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { headers, rows };
}

export function unparseCsv(headers, rows, delimiter = ';') {
  const d = delimiter === 'auto' ? ';' : delimiter;
  return '\uFEFF' + Papa.unparse({ fields: headers, data: rows }, { delimiter: d, newline: '\r\n' });
}

function normalizeColor(str) {
  const m = String(str || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return '';
  let hex = m[1].toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return '#' + hex;
}

// Group ids: a number is a tent group, anything else is an infrastructure group named like the id.
const isTentKey = (key) => /^\d+$/.test(key);
export function normalizeGroupKey(value) {
  const s = String(value ?? '').trim();
  if (isTentKey(s)) {
    const n = parseInt(s, 10);
    return n > 0 ? String(n) : '';
  }
  return s;
}
export const groupKey = (group) => (group.kind === 'infra' ? group.title : group.number ? String(group.number) : '');

export function makeUnassigned() {
  return { id: 'unassigned', number: 0, title: 'Nicht zugeordnet', color: '', kind: 'tent', staff: [], blocks: [{ id: 'unassigned-block', participants: [] }] };
}

// Turns parsed rows into people + groups according to the configuration.
export function buildData(headers, rows, config, groupFile = null) {
  const warnings = [];
  const warn = (msg) => warnings.push(msg);

  const colByHeader = new Map();
  config.columns.forEach((c) => { if (c.field) colByHeader.set(norm(c.header), c); });

  const cols = headers.map((h) => ({ header: h, col: colByHeader.get(norm(h)) || null }));
  const matched = cols.filter((c) => c.col).map((c) => c.header);
  const unmatched = cols.filter((c) => !c.col).map((c) => c.header);
  const headerSet = new Set(headers.map(norm));
  const missing = config.columns.filter((c) => c.field && !headerSet.has(norm(c.header))).map((c) => c.header);

  const colOf = (field) => cols.find((c) => c.col && c.col.field === field)?.header;
  const has = (field) => colOf(field) !== undefined;
  const extraCols = cols.filter((c) => c.col && (c.col.field === 'extraText' || c.col.field === 'extraScale'));

  const tnV = splitList(config.values.tn);
  const maV = splitList(config.values.ma);
  const maleV = splitList(config.values.male);
  const femaleV = splitList(config.values.female);
  const leaderV = splitList(config.values.leaderTrue);

  const people = {};
  const groupsByKey = new Map();
  const blocksByGroup = new Map();
  const unassigned = makeUnassigned();
  const unassignedBlocks = new Map();
  const groups = [];

  const ensureGroup = (key) => {
    let group = groupsByKey.get(key);
    if (group) return group;
    const tent = isTentKey(key);
    group = { id: uid('g'), number: tent ? parseInt(key, 10) : 0, title: tent ? '' : key, color: '', kind: tent ? 'tent' : 'infra', staff: [], blocks: [] };
    groupsByKey.set(key, group);
    blocksByGroup.set(group.id, new Map());
    groups.push(group);
    return group;
  };

  rows.forEach((row, rowIndex) => {
    const line = rowIndex + 2;
    const get = (field) => {
      const h = colOf(field);
      return h === undefined ? '' : String(row[h] ?? '').trim();
    };

    // type
    let type = 'TN';
    if (has('type')) {
      const t = norm(get('type'));
      if (maV.includes(t)) type = 'MA';
      else if (tnV.includes(t)) type = 'TN';
      else warn(`Zeile ${line}: Unbekannter Typ „${get('type')}“ – wird als TN behandelt.`);
    }

    // sex
    let sex = '';
    const sx = norm(get('sex'));
    if (sx) {
      if (maleV.includes(sx)) sex = 'm';
      else if (femaleV.includes(sx)) sex = 'f';
      else warn(`Zeile ${line}: Unbekanntes Geschlecht „${get('sex')}“.`);
    }

    const birthday = get('birthday');
    if (birthday && !parseDate(birthday)) warn(`Zeile ${line}: Geburtstag „${birthday}“ nicht lesbar (erwartet TT.MM.JJJJ oder JJJJ-MM-TT).`);

    const person = {
      id: 'p' + rowIndex,
      type,
      firstName: get('firstName'),
      lastName: get('lastName'),
      sex,
      birthday,
      city: get('city'),
      wishes: [1, 2, 3, 4, 5].map((i) => get('wish' + i)),
      ignoredWishes: (get('ignoredWishes').match(/[1-5]/g) || []).map(Number),
      leader: leaderV.includes(norm(get('leader'))),
      guitar: get('guitar'),
      extras: extraCols
        .map((c) => ({ kind: c.col.field === 'extraScale' ? 'scale' : 'text', label: c.header, value: String(row[c.header] ?? '').trim() }))
        .filter((e) => e.value !== ''),
      raw: row,
    };
    people[person.id] = person;

    // group assignment
    const key = normalizeGroupKey(get('group'));
    if (!key) {
      if (type === 'MA') {
        unassigned.staff.push(person.id);
      } else {
        // Wish blocks without a group: blocks[0] is the pool of loose participants.
        const bKey = get('block');
        let block = unassigned.blocks[0];
        if (bKey) {
          block = unassignedBlocks.get(bKey);
          if (!block) {
            block = { id: uid('b'), participants: [] };
            unassignedBlocks.set(bKey, block);
            unassigned.blocks.push(block);
          }
        }
        block.participants.push(person.id);
      }
      return;
    }

    const group = ensureGroup(key);

    if (type === 'MA') {
      group.staff.push(person.id);
    } else {
      const bKey = get('block');
      const map = blocksByGroup.get(group.id);
      let block = map.get(bKey);
      if (!block) {
        block = { id: uid('b'), participants: [] };
        map.set(bKey, block);
        group.blocks.push(block);
      }
      block.participants.push(person.id);
    }
  });

  if (groupFile) {
    const find = (name) => groupFile.headers.find((h) => norm(h) === norm(name));
    const idH = find(config.groupFile.id);
    const nameH = find(config.groupFile.name);
    const colorH = find(config.groupFile.color);
    if (idH === undefined) {
      warn(`Gruppen-CSV: Spalte „${config.groupFile.id}“ nicht gefunden – die Datei wird ignoriert.`);
    } else {
      for (const r of groupFile.rows) {
        const key = normalizeGroupKey(r[idH]);
        if (!key) continue;
        const group = ensureGroup(key);
        const name = nameH ? String(r[nameH] ?? '').trim() : '';
        if (name && group.kind === 'tent') group.title = name;
        const color = normalizeColor(colorH ? r[colorH] : '');
        if (color) group.color = color;
      }
    }
  }

  groups.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'tent' ? -1 : 1) || a.number - b.number || a.title.localeCompare(b.title));
  groups.forEach((g, i) => {
    if (!g.color) g.color = GROUP_PALETTE[i % GROUP_PALETTE.length];
    if (g.kind === 'tent' && g.blocks.length === 0) g.blocks.push({ id: uid('b'), participants: [] });
  });

  return {
    people,
    groups,
    unassigned,
    warnings,
    info: {
      matched,
      unmatched,
      missing,
      rows: rows.length,
      tn: Object.values(people).filter((p) => p.type === 'TN').length,
      ma: Object.values(people).filter((p) => p.type === 'MA').length,
      groups: groups.length,
    },
  };
}

// Builds the export table from the current assignment.
// Returns { headers, rows, addedColumns } – addedColumns are headers that were not part of the configuration yet.
export function buildExport(data, config) {
  const fieldOfHeader = new Map(config.columns.filter((c) => c.field).map((c) => [norm(c.header), c.field]));
  const headers = [...(data.importedHeaders?.length ? data.importedHeaders : config.columns.map((c) => c.header))];
  const addedColumns = [];

  const anyIgnored = Object.values(data.people).some((p) => p.ignoredWishes.length);
  for (const f of GROUP_FIELDS) {
    if (f === 'ignoredWishes' && !anyIgnored) continue;
    if (headers.some((h) => fieldOfHeader.get(norm(h)) === f)) continue;
    const configured = config.columns.find((c) => c.field === f);
    if (configured) {
      headers.push(configured.header);
    } else {
      const header = DEFAULT_HEADERS[f];
      headers.push(header);
      fieldOfHeader.set(norm(header), f);
      addedColumns.push({ header, field: f });
    }
  }

  const leaderValue = String(config.values.leaderTrue || 'ja').split(',')[0].trim() || 'ja';
  const rows = [];

  const emit = (id, group, blockIndex) => {
    const p = data.people[id];
    if (!p) return;
    const isReal = group && group.id !== 'unassigned';
    rows.push(headers.map((h) => {
      const field = fieldOfHeader.get(norm(h));
      const wish = field && field.match(/^wish([1-5])$/);
      if (wish) return p.wishes[+wish[1] - 1];
      switch (field) {
        case 'firstName': return p.firstName;
        case 'lastName': return p.lastName;
        case 'group': return isReal ? groupKey(group) : '';
        case 'block':
          if (p.type !== 'TN' || blockIndex < 0) return '';
          // Unassigned: the loose pool (index 0) stays blank, wish blocks are numbered from 1.
          return isReal ? String(blockIndex + 1) : blockIndex >= 1 ? String(blockIndex) : '';
        case 'leader': return p.type === 'MA' && p.leader ? leaderValue : '';
        case 'ignoredWishes': return p.ignoredWishes.join('-');
        default: return p.raw?.[h] ?? '';
      }
    }));
  };

  for (const g of [...data.groups, data.unassigned]) {
    g.staff.forEach((id) => emit(id, g, -1));
    g.blocks.forEach((b, bi) => b.participants.forEach((id) => emit(id, g, bi)));
  }
  return { headers, rows, addedColumns };
}

export function exportCsv(data, config) {
  const { headers, rows, addedColumns } = buildExport(data, config);
  return { text: unparseCsv(headers, rows, config.delimiter), addedColumns };
}

// Group file: one row per group (also empty ones). Tent groups are identified by number, infrastructure groups by name.
export function exportGroupsCsv(data, config) {
  const f = config.groupFile;
  const rows = data.groups.map((g) => [groupKey(g), g.kind === 'infra' ? '' : g.title, g.color]);
  return unparseCsv([f.id, f.name, f.color], rows, config.delimiter);
}

// Printable overview: one column per group.
export function overviewCsv(data, config) {
  const hasGuitar = config.columns.some((c) => c.field === 'guitar');
  const display = (p) => {
    const name = `${p.firstName} ${p.lastName}`.trim();
    return hasGuitar && Number(p.guitar) >= 2 ? name + ' (G)' : name;
  };
  const sortSex = (list) => [...list.filter((p) => p.sex === 'm'), ...list.filter((p) => p.sex !== 'm')];

  const columns = [];
  const all = [...data.groups, data.unassigned].filter((g) => g.id !== 'unassigned' || g.staff.length || g.blocks[0].participants.length);
  for (const g of all) {
    const staff = g.staff.map((id) => data.people[id]).filter(Boolean);
    const leaders = sortSex(staff.filter((p) => p.leader));
    const members = sortSex(staff.filter((p) => !p.leader));
    const tn = g.blocks.flatMap((b) => b.participants).map((id) => data.people[id]).filter(Boolean);
    const col = [(g.number ? `Gruppe ${g.number}${g.title ? ' – ' : ''}` : '') + g.title];
    if (leaders.length) col.push('Gruppenleiter', ...leaders.map(display));
    if (members.length) col.push('Mitarbeiter', ...members.map(display));
    if (tn.length) col.push('Teilnehmer', ...tn.map((p) => `${p.firstName} ${p.lastName}`.trim()));
    columns.push(col);
  }
  const height = Math.max(0, ...columns.map((c) => c.length));
  const rows = Array.from({ length: height }, (_, r) => columns.map((c) => c[r] ?? ''));
  const text = Papa.unparse({ fields: columns.map((c) => c[0]), data: rows.slice(1) }, { delimiter: config.delimiter === 'auto' ? ';' : config.delimiter, newline: '\r\n' });
  return '\uFEFF' + text;
}

// Sample file matching the configured columns.
export function sampleCsv(config) {
  const first = (s, fallback) => String(s || fallback).split(',')[0].trim() || fallback;
  const scaleValue = (key, i) => config.scales[key]?.[Math.min(i, (config.scales[key]?.length || 1) - 1)]?.value ?? '';
  const samples = [
    { type: first(config.values.tn, 'TN'), firstName: 'Max', lastName: 'Mustermann', sex: first(config.values.male, 'm'), birthday: '12.05.2012', city: 'Lippstadt', wish1: 'Erika Musterfrau', wish2: 'Jonas Beispiel', guitar: scaleValue('guitar', 0), group: '1', block: '1' },
    { type: first(config.values.tn, 'TN'), firstName: 'Erika', lastName: 'Musterfrau', sex: first(config.values.female, 'w'), birthday: '03.08.2012', city: 'Soest', wish1: 'Max Mustermann', group: '1', block: '1' },
    { type: first(config.values.tn, 'TN'), firstName: 'Lena', lastName: 'Beispiel', sex: first(config.values.female, 'w'), birthday: '21.11.2011', city: 'Hamm', wish1: 'Erika Musterfrau' },
    { type: first(config.values.ma, 'MA'), firstName: 'Jonas', lastName: 'Beispiel', sex: first(config.values.male, 'm'), birthday: '20.01.2002', city: 'Lippstadt', guitar: scaleValue('guitar', 3), group: '1', leader: first(config.values.leaderTrue, 'ja') },
    { type: first(config.values.ma, 'MA'), firstName: 'Sarah', lastName: 'Probe', sex: first(config.values.female, 'w'), birthday: '14.09.2001', city: 'Soest', guitar: scaleValue('guitar', 1), group: 'Küche' },
  ];
  const headers = config.columns.map((c) => c.header);
  const rows = samples.map((s) => config.columns.map((c) => {
    if (c.field === 'extraText') return 'Beispiel';
    if (c.field === 'extraScale') return scaleValue('extraScale', 2);
    return s[c.field] ?? '';
  }));
  return unparseCsv(headers, rows, config.delimiter);
}

export function sampleGroupsCsv(config) {
  const f = config.groupFile;
  return unparseCsv([f.id, f.name, f.color], [['1', 'Adler', '#43a047'], ['Küche', '', '#fb8c00']], config.delimiter);
}
