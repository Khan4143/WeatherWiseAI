import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './context/AppProvider';
import BottomTab from './navigation/BottomTab';

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <BottomTab />
      </NavigationContainer>
    </AppProvider>
  );
} 