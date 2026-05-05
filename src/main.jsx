import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { applyTheme, getStoredTheme } from './utils/theme.js';

// Apply saved theme before first render to avoid flash
applyTheme(getStoredTheme());

// Service worker is registered automatically by vite-plugin-pwa (workbox).
// No manual registration needed here — doing it twice causes duplicate logs.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
