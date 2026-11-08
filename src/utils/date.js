const pad = (n) => String(n).padStart(2, '0');

// Accepts DD.MM.YYYY and YYYY-MM-DD (optionally followed by a time part).
export function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  let y, mo, d, m;
  if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) {
    d = +m[1]; mo = +m[2]; y = +m[3];
  } else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    y = +m[1]; mo = +m[2]; d = +m[3];
  } else {
    return null;
  }
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function ageYears(str, now = new Date()) {
  const d = parseDate(str);
  if (!d) return null;
  return (now - d) / (365.25 * 24 * 3600 * 1000);
}

export function formatDate(str) {
  const d = parseDate(str);
  return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : String(str ?? '');
}
