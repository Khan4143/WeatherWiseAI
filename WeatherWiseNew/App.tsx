import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import BottomTab from './src/navigation/BottomTab';
import { WeatherProvider } from './src/context/WeatherContext';
import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <WeatherProvider>
        <SettingsProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <BottomTab />
      </NavigationContainer>
        </SettingsProvider>
      </WeatherProvider>
    </SafeAreaProvider>
  );
}
