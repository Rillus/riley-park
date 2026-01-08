'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme | null;
    const initialTheme = stored || 'system';
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  useEffect(() => {
    updateTheme(theme);
  }, [theme]);

  const updateTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    let actualTheme: 'light' | 'dark';

    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      actualTheme = newTheme;
    }

    setResolvedTheme(actualTheme);

    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', newTheme);
  };

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
  };
}

