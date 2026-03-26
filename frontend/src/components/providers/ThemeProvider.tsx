'use client';

import { useEffect } from 'react';
import { useTheme } from '@/stores/preferences-store';

/** Applies the theme class to document.documentElement. Renders nothing. */
export function ThemeProvider() {
  const [theme] = useTheme();

  useEffect(() => {
    function applyTheme(prefersDark: boolean) {
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }

    applyTheme(theme === 'dark');
  }, [theme]);

  return null;
}
