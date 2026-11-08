import { ageYears } from '../utils/date.js';

// Counts, sex distribution and average age for a list of persons.
export function summarize(persons) {
  const ages = persons.map((p) => ageYears(p.birthday)).filter((a) => a !== null);
  const m = persons.filter((p) => p.sex === 'm').length;
  const f = persons.filter((p) => p.sex === 'f').length;
  return {
    count: persons.length,
    m,
    f,
    hasSex: m + f > 0,
    avg: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
  };
}
