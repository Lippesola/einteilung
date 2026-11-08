import { ref } from 'vue';

const KEY = 'einteilung.theme';

function stored() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Explicit choice wins, otherwise follow the system setting.
export const theme = ref(stored() || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

export function applyTheme() {
  document.documentElement.dataset.theme = theme.value;
}

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, theme.value);
  } catch { /* ignore */ }
  applyTheme();
}
