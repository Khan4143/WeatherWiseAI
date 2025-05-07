import React from 'react';
import { WeatherProvider } from './WeatherContext';
import { SettingsProvider } from './SettingsContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WeatherProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </WeatherProvider>
  );
} 