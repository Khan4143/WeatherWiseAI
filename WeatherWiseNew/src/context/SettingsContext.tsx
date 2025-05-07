import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface SettingsContextType {
  temperatureUnit: 'celsius' | 'fahrenheit';
  setTemperatureUnit: (unit: 'celsius' | 'fahrenheit') => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  useLocation: boolean;
  setUseLocation: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [temperatureUnit, setTemperatureUnitState] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [useLocation, setUseLocation] = useState(true);

  const saveSettings = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const setTemperatureUnit = async (unit: 'celsius' | 'fahrenheit') => {
    setTemperatureUnitState(unit);
    await saveSettings('temperatureUnit', unit);
  };

  return (
    <SettingsContext.Provider
      value={{
        temperatureUnit,
        setTemperatureUnit,
        darkMode,
        setDarkMode,
        notificationsEnabled,
        setNotificationsEnabled,
        useLocation,
        setUseLocation,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 