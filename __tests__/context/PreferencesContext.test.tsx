import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PreferencesProvider, usePreferences } from 'context/PreferencesContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>{children}</PreferencesProvider>
);

describe('PreferencesContext', () => {
  it('defaults to litres (useGallons false)', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.useGallons).toBe(false);
  });

  it('reads gallons preference from localStorage', () => {
    localStorage.setItem('unit_preference', 'gallons');
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.useGallons).toBe(true);
  });

  it('reads litres preference from localStorage', () => {
    localStorage.setItem('unit_preference', 'litres');
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.useGallons).toBe(false);
  });

  it('toggleUnit switches from litres to gallons', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      result.current.toggleUnit();
    });

    expect(result.current.useGallons).toBe(true);
    expect(localStorage.getItem('unit_preference')).toBe('gallons');
  });

  it('toggleUnit switches from gallons to litres', () => {
    localStorage.setItem('unit_preference', 'gallons');
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      result.current.toggleUnit();
    });

    expect(result.current.useGallons).toBe(false);
    expect(localStorage.getItem('unit_preference')).toBe('litres');
  });

  it('persists preference across toggles', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      result.current.toggleUnit(); // litres → gallons
    });
    act(() => {
      result.current.toggleUnit(); // gallons → litres
    });

    expect(result.current.useGallons).toBe(false);
    expect(localStorage.getItem('unit_preference')).toBe('litres');
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => usePreferences());
    }).toThrow('usePreferences must be used within a PreferencesProvider');
  });
});
