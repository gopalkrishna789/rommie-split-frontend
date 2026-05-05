/**
 * Dark mode helpers — persists preference in localStorage and toggles
 * the `dark` class on <html>.
 */

export function getStoredTheme() {
  try {
    return localStorage.getItem('roomie_theme') || 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem('roomie_theme', theme);
  } catch {}
}

export function toggleTheme() {
  const current = getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

// Apply on load (before React mounts) to avoid flash
applyTheme(getStoredTheme());
