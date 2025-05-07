import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Weather Wise' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>WeatherWise</Text>
          <Text style={styles.subtitle}>Your personal weather assistant</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
}); 