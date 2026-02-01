import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  initTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'app-theme';

const applyThemeClass = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  initTheme: () => {
    const stored = (localStorage.getItem(THEME_KEY) as Theme | null) || null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme: Theme = stored || (prefersDark ? 'dark' : 'light');
    applyThemeClass(theme);
    set({ theme });
  },
  setTheme: (theme) => {
    applyThemeClass(theme);
    localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
