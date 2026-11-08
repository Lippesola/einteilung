import assert from 'node:assert/strict';
import { defaultConfig } from '../src/model/fields.js';
import { parseCsv, buildData, buildExport, exportCsv, exportGroupsCsv, overviewCsv, sampleCsv, sampleGroupsCsv } from '../src/model/csv.js';

const config = defaultConfig();

// 1. The sample file must import cleanly and reconstruct its group.
const sample = sampleCsv(config);
const parsed = parseCsv(sample, config.delimiter);
assert.deepEqual(parsed.headers, config.columns.map((c) => c.header));
// Without a group file the groups come from the ids alone: number = tent group, text = infrastructure.
const idsOnly = buildData(parsed.headers, parsed.rows, config);
assert.deepEqual(idsOnly.groups.map((g) => [g.kind, g.number, g.title]), [['tent', 1, ''], ['infra', 0, 'Küche']]);

const groupFile = parseCsv(sampleGroupsCsv(config), config.delimiter);
const data = buildData(parsed.headers, parsed.rows, config, groupFile);
assert.equal(data.warnings.length, 0, data.warnings.join('\n'));
assert.equal(data.info.tn, 3);
assert.equal(data.info.ma, 2);
assert.equal(data.groups.length, 2);
assert.equal(data.groups[0].title, 'Adler');
assert.equal(data.groups[0].color, '#43a047');
assert.equal(data.groups[1].title, 'Küche');
assert.equal(data.groups[1].staff.length, 1);
assert.equal(data.groups[0].staff.length, 1);
assert.equal(data.groups[0].blocks[0].participants.length, 2);
assert.equal(data.unassigned.staff.length, 0);
assert.equal(data.unassigned.blocks[0].participants.length, 1);
assert.ok(data.people[data.groups[0].staff[0]].leader);

// 2. Export -> re-import gives the same assignment (move a person first).
const state = { ...data, importedHeaders: parsed.headers };
const lena = Object.values(state.people).find((p) => p.firstName === 'Lena');
state.unassigned.blocks[0].participants = [];
state.groups[0].blocks.push({ id: 'bX', participants: [lena.id] });
lena.wishes[1] = 'Max Mustermann';

const { text } = exportCsv(state, config);
assert.ok(text.startsWith('﻿'));
const again = parseCsv(text, config.delimiter);
const data2 = buildData(again.headers, again.rows, config);
assert.equal(data2.warnings.length, 0);
assert.equal(data2.groups[0].blocks.length, 2);
assert.equal(data2.groups[0].blocks[1].participants.length, 1);
assert.equal(data2.people[data2.groups[0].blocks[1].participants[0]].firstName, 'Lena');
assert.equal(data2.people[data2.groups[0].blocks[1].participants[0]].wishes[1], 'Max Mustermann');
assert.equal(data2.unassigned.staff.length, 0);

// Empty groups survive thanks to the group file.
state.groups.push({ id: 'gE', number: 7, title: 'Leer', color: '#112233', kind: 'tent', staff: [], blocks: [{ id: 'bE', participants: [] }] });
const withEmpty = buildData(again.headers, again.rows, config, parseCsv(exportGroupsCsv(state, config), config.delimiter));
assert.ok(withEmpty.groups.some((g) => g.number === 7 && g.title === 'Leer'));

// 3. Unknown columns pass through, missing optional columns are tolerated.
const minimal = 'Vorname;Nachname;Bemerkung\nAnna;Alt;hallo\nBen;Bunt;x\n';
const p3 = parseCsv(minimal, ';');
const d3 = buildData(p3.headers, p3.rows, config);
assert.equal(d3.info.tn, 2);
assert.deepEqual(d3.info.unmatched, ['Bemerkung']);
const e3 = buildExport({ ...d3, importedHeaders: p3.headers }, config);
assert.ok(e3.headers.includes('Bemerkung'));
assert.ok(e3.headers.includes('Gruppe'));
assert.ok(!e3.headers.includes('Gruppenname'));
assert.equal(e3.rows[0][e3.headers.indexOf('Bemerkung')], 'hallo');

// 4. Overview contains group column header.
assert.ok(overviewCsv(state, config).includes('Gruppe 1 – Adler'));

console.log('OK');
