// Wish matching, ported from getWishes() of lama-app's GroupPage.vue.
// A wish counts as "known" when it contains the last name and a part of the first name of a participant.

// Returns match(text, selfId) -> id of the first participant (among ids) named in the wish text, or undefined.
export function makeWishMatcher(people, ids) {
  const index = ids
    .map((id) => people[id])
    .filter((p) => p && p.type === 'TN')
    .map((p) => ({
      id: p.id,
      first: p.firstName.toLowerCase().split(/\s+/).filter((t) => t.length > 1),
      last: p.lastName.trim().toLowerCase(),
    }));
  return (text, selfId) => {
    const lower = text.toLowerCase();
    for (const t of index) {
      if (t.id === selfId || !t.last) continue;
      if (lower.includes(t.last) && t.first.some((f) => lower.includes(f))) return t.id;
    }
    return undefined;
  };
}

export function computeWishInfo(people, locations) {
  const tn = Object.values(people).filter((p) => p.type === 'TN');
  const match = makeWishMatcher(people, tn.map((p) => p.id));

  const out = {};
  for (const p of tn) {
    const ownGroup = locations[p.id]?.groupId;
    const wishes = [];
    p.wishes.forEach((text, i) => {
      if (!text) return;
      const wish = { name: text, index: i + 1, ignored: p.ignoredWishes.includes(i + 1), groupId: undefined, targetId: undefined };
      const target = match(text, p.id);
      if (target) {
        wish.targetId = target;
        wish.groupId = locations[target]?.groupId;
      }
      wishes.push(wish);
    });

    const unignored = wishes.filter((w) => !w.ignored);
    const placed = ownGroup && ownGroup !== 'unassigned';
    const fulfilled = unignored.filter((w) => placed && w.groupId !== undefined && w.groupId === ownGroup);
    const unknown = unignored.filter((w) => w.groupId === undefined);

    let color = 'red';
    if (unignored.length === 0 || !placed) color = 'grey';
    else if (fulfilled.length === unignored.length) color = 'green';
    else if (unknown.length > 0) color = 'blue';
    else if (fulfilled.length > 0) color = 'orange';

    out[p.id] = { wishes, total: unignored.length, fulfilled: fulfilled.length, color };
  }
  return out;
}
