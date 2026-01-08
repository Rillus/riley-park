'use client';

import * as React from 'react';
import { useTheme } from '@/lib/hooks/use-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return <>{children}</>;
}

