import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

const initDarkMode = () => {
  const stored = localStorage.getItem('linearvis-storage');
  let isDark = true;

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      isDark = parsed.state?.darkMode ?? true;
    } catch {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  return isDark;
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

initDarkMode();

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount();
  });
}