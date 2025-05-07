import { Stack } from 'expo-router';
import React from 'react';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" />
    </Stack>
  );
} 