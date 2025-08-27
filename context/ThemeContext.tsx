'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Start with a null state to avoid hydration mismatch
  const [theme, setTheme] = useState<ThemeType | null>(null);

  useEffect(() => {
    // Initialize theme only on client side, but respect the current data-theme attribute
    const dataTheme = document.documentElement.getAttribute('data-theme') as ThemeType;
    if (dataTheme && ['light', 'dark'].includes(dataTheme)) {
      // This ensures we match what's already in the DOM to avoid flickering
      setTheme(dataTheme);
    } else {
      // Fallback to the usual logic if no data-theme attribute exists
      const savedTheme = localStorage.getItem('theme') as ThemeType;
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, []);

  useEffect(() => {
    // Only update DOM after theme is initialized on client
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (!prevTheme) return 'light';
      return prevTheme === 'light' ? 'dark' : 'light';
    });
  };

  // Provide a default theme until the real theme is loaded
  const contextValue = {
    theme: theme || 'light',
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
