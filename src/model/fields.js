// Field definitions, default configuration and header heuristics.

export const FIELDS = [
  { key: 'type', label: 'Typ (TN/MA)' },
  { key: 'firstName', label: 'Vorname' },
  { key: 'lastName', label: 'Nachname' },
  { key: 'sex', label: 'Geschlecht' },
  { key: 'birthday', label: 'Geburtstag' },
  { key: 'city', label: 'Ort / Gemeinde' },
  ...[1, 2, 3, 4, 5].map((i) => ({ key: 'wish' + i, label: 'Wunsch ' + i })),
  { key: 'guitar', label: 'Gitarre (Skala)' },
  { key: 'extraScale', label: 'Zusatzinfo (Skala)', repeatable: true },
  { key: 'extraText', label: 'Zusatzinfo (Text)', repeatable: true },
  { key: 'group', label: 'Gruppe (Nr. oder Name)' },
  { key: 'block', label: 'Block' },
  { key: 'leader', label: 'Gruppenleiter (GL)' },
  { key: 'ignoredWishes', label: 'Ignorierte Wünsche' },
];

export const PASSTHROUGH_LABEL = '– nicht zugeordnet (wird durchgereicht) –';

export const SCALE_FIELDS = ['guitar', 'extraScale'];
export const SCALE_TITLES = { guitar: 'Gitarre', extraScale: 'Zusatzinfo (Skala)' };

// Fields whose value is written by the export from the current assignment.
export const GROUP_FIELDS = ['group', 'block', 'leader', 'ignoredWishes'];

// Header names used when the export has to add a column that is not configured yet.
export const DEFAULT_HEADERS = { group: 'Gruppe', block: 'Block', leader: 'GL', ignoredWishes: 'Ignorierte Wünsche' };

export const COLORS = {
  red: '#e53935',
  orange: '#fb8c00',
  yellow: '#fdd835',
  green: '#43a047',
  blue: '#1e88e5',
  grey: '#9e9e9e',
};

export const GROUP_PALETTE = ['#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac', '#ff8a65', '#a1887f', '#90a4ae', '#f06292'];

export const KIND_LABELS = { tent: 'Zeltgruppe', infra: 'Infrastruktur' };

let counter = 0;
export const uid = (prefix = 'x') =>
  prefix + Date.now().toString(36) + (counter++).toString(36) + Math.random().toString(36).slice(2, 5);

const col = (header, field) => ({ id: uid('c'), header, field });

export function defaultConfig() {
  return {
    delimiter: ';',
    columns: [
      col('Typ', 'type'),
      col('Vorname', 'firstName'),
      col('Nachname', 'lastName'),
      col('Geschlecht', 'sex'),
      col('Geburtstag', 'birthday'),
      col('Ort', 'city'),
      col('Wunsch 1', 'wish1'),
      col('Wunsch 2', 'wish2'),
      col('Wunsch 3', 'wish3'),
      col('Wunsch 4', 'wish4'),
      col('Wunsch 5', 'wish5'),
      col('Gitarre', 'guitar'),
      col('Gruppe', 'group'),
      col('Block', 'block'),
      col('GL', 'leader'),
      col('Ignorierte Wünsche', 'ignoredWishes'),
    ],
    // Optional second file: one row per group (id = number for tent groups, name for infrastructure).
    groupFile: { id: 'Gruppe', name: 'Name', color: 'Farbe' },
    values: {
      tn: 'TN, Teilnehmer',
      ma: 'MA, Mitarbeiter',
      male: 'm, männlich',
      female: 'w, weiblich',
      leaderTrue: 'ja, 1, x, true, GL',
    },
    scales: {
      guitar: [
        { value: '0', label: 'Nein', color: 'red' },
        { value: '1', label: 'Nein, ich bin Anfänger', color: 'orange' },
        { value: '2', label: 'Ja, ich bin fortgeschritten', color: 'yellow' },
        { value: '3', label: 'Ja, ich bin Profi', color: 'green' },
      ],
      extraScale: [
        { value: '0', label: 'Nein', color: 'red' },
        { value: '1', label: 'Wahrscheinlich Nein', color: 'orange' },
        { value: '2', label: 'Wahrscheinlich Ja', color: 'yellow' },
        { value: '3', label: 'Ja', color: 'green' },
      ],
    },
  };
}

// Merges a stored/imported config into the defaults and makes sure all columns have ids.
export function sanitizeConfig(raw) {
  const def = defaultConfig();
  if (!raw || typeof raw !== 'object') return def;
  // Older versions stored group name/color/kind per person; those now live in the group file.
  const dropped = ['groupName', 'groupColor', 'groupKind'];
  const cfg = {
    delimiter: raw.delimiter ?? def.delimiter,
    columns: Array.isArray(raw.columns)
      ? raw.columns
          .filter((c) => !dropped.includes(c.field))
          .map((c) => ({ id: c.id || uid('c'), header: String(c.header ?? ''), field: c.field === 'groupNumber' ? 'group' : c.field || '' }))
      : def.columns,
    groupFile: { ...def.groupFile, ...(raw.groupFile || {}) },
    values: { ...def.values, ...(raw.values || {}) },
    scales: { ...def.scales, ...(raw.scales || {}) },
  };
  return cfg;
}

const GUESSES = [
  [/^(typ|type|rolle|art)$/i, 'type'],
  [/vorname|first/i, 'firstName'],
  [/nachname|familienname|surname|last/i, 'lastName'],
  [/geschlecht|sex|gender/i, 'sex'],
  [/geburt|birth/i, 'birthday'],
  [/wunsch\s*-?\s*([1-5])|wish\s*-?\s*([1-5])/i, 'wish'],
  [/gitarre|guitar/i, 'guitar'],
  [/gruppenname|gruppenfarbe|gruppentyp|groupname|groupcolor|groupkind/i, ''],
  [/ignor/i, 'ignoredWishes'],
  [/^(gl|leiter|gruppenleiter|leader)$/i, 'leader'],
  [/block/i, 'block'],
  [/^(gruppe|gruppen-?nr\.?|gruppennummer|group)/i, 'group'],
  [/ort|stadt|city|gemeinde|church/i, 'city'],
];

export function guessField(header) {
  const h = String(header).trim();
  for (const [re, field] of GUESSES) {
    const m = h.match(re);
    if (!m) continue;
    if (field === 'wish') return 'wish' + (m[1] || m[2]);
    return field;
  }
  return '';
}
