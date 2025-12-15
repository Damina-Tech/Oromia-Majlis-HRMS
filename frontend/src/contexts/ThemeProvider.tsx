import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const THEME_STORAGE_KEY = 'chiro_hrms_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
    >
      {children}
    </NextThemesProvider>
  );
};

