import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defaultConfig } from '../src/model/fields.js';
import { parseCsv, buildData, exportCsv } from '../src/model/csv.js';
import { clusterByWishes } from '../src/model/autosort.js';

const config = defaultConfig();
const text = fs.readFileSync(new URL('../beispiel/beispiel.csv', import.meta.url), 'utf8');
const parsed = parseCsv(text, ';');
const data = buildData(parsed.headers, parsed.rows, config);
const ids = data.unassigned.blocks[0].participants;
const name = (id) => `${data.people[id].firstName} ${data.people[id].lastName}`;

const { clusters, singles } = clusterByWishes(data.people, ids);
assert.equal(clusters.flat().length + singles.length, 30);
const find = (n) => clusters.find((c) => c.some((id) => name(id) === n));
// Mutual wishes end up together, a participant without a connection stays loose.
assert.ok(find('Lena Brinkmann').map(name).includes('Sophie Wittkamp'));
assert.ok(singles.map(name).includes('Anna Sundermann'));
assert.ok(clusters[0].length >= clusters.at(-1).length);

// Ignoring a wish can split a block.
const emma = Object.values(data.people).find((p) => p.firstName === 'Emma');
const lea = Object.values(data.people).find((p) => p.firstName === 'Lea');
const before = find('Emma Kleine').includes(lea.id);
assert.ok(before);
emma.ignoredWishes = [1, 2]; // Lea + Greta
lea.ignoredWishes = [1]; // Emma
const after = clusterByWishes(data.people, ids);
assert.ok(!after.clusters.some((c) => c.includes(emma.id) && c.includes(lea.id)));
emma.ignoredWishes = [];
lea.ignoredWishes = [];

// Wish blocks without a group survive export -> import.
const u = data.unassigned;
const re = clusterByWishes(data.people, ids);
u.blocks = [{ id: 'pool', participants: re.singles }, ...re.clusters.map((c, i) => ({ id: 'b' + i, participants: c }))];
const state = { ...data, importedHeaders: parsed.headers };
const out = exportCsv(state, config);
const again = buildData(...Object.values(parseCsv(out.text, ';')).slice(0, 2), config);
assert.equal(again.unassigned.blocks.length, u.blocks.length);
assert.equal(again.unassigned.blocks[1].participants.length, u.blocks[1].participants.length);
assert.equal(again.unassigned.blocks[0].participants.length, re.singles.length);
console.log('OK');
