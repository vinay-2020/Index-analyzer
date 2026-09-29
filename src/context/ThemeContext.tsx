import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'navy' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'navy';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('hmie_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'navy' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const updateResolved = () => {
      let active: ResolvedTheme = 'light';
      if (theme === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isDark ? 'dark' : 'light';
      } else {
        active = theme;
      }
      setResolvedTheme(active);

      const root = document.documentElement;
      root.classList.remove('dark', 'theme-navy');
      root.removeAttribute('data-theme');

      if (active === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else if (active === 'navy') {
        root.classList.add('dark', 'theme-navy');
        root.setAttribute('data-theme', 'navy');
      } else {
        root.setAttribute('data-theme', 'light');
      }
    };

    updateResolved();

    if (theme === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateResolved();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('hmie_theme_mode', newTheme);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
