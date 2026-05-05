import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getStoredTheme, toggleTheme } from '../utils/theme';

/**
 * Dark / light mode toggle button.
 * Drop it anywhere in a header — it's self-contained.
 */
export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getStoredTheme);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      style={{ color: '#6B7280' }}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={1.75} />
      ) : (
        <Moon size={18} strokeWidth={1.75} />
      )}
    </button>
  );
}
