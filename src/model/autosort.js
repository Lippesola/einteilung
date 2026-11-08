// Pre-sorting of wish blocks, ported from autoSort() of lama-api's group.controller.js:
// participants that (transitively) wish for each other end up in the same block.
import { makeWishMatcher } from './wishes.js';

export function clusterByWishes(people, ids) {
  const tnIds = ids.filter((id) => people[id]?.type === 'TN');
  const match = makeWishMatcher(people, tnIds);

  const parent = new Map(tnIds.map((id) => [id, id]));
  const find = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  for (const id of tnIds) {
    people[id].wishes.forEach((text, i) => {
      if (!text || people[id].ignoredWishes.includes(i + 1)) return;
      const target = match(text, id);
      if (target) union(id, target);
    });
  }

  const byRoot = new Map();
  for (const id of tnIds) {
    const root = find(id);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(id);
  }
  const all = [...byRoot.values()];
  return {
    clusters: all.filter((l) => l.length > 1).sort((a, b) => b.length - a.length),
    singles: all.filter((l) => l.length === 1).map((l) => l[0]),
  };
}
