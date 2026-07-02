import React, { createContext, ReactElement, useContext, useState } from 'react';

const STORAGE_KEY = 'unit_preference';

interface PreferencesContextType {
  useGallons: boolean;
  toggleUnit: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [useGallons, setUseGallons] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === 'gallons';
  });

  const toggleUnit = (): void => {
    setUseGallons((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'gallons' : 'litres');
      return next;
    });
  };

  return <PreferencesContext.Provider value={{ useGallons, toggleUnit }}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
