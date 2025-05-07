import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ForecastScreen from '../screens/ForecastScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AICommuteScreen from '../screens/AICommuteScreen';

type BottomTabParamList = {
  Home: undefined;
  Forecast: undefined;
  AICommute: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <MaterialCommunityIcons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />;
          } else if (route.name === 'Forecast') {
            return <MaterialCommunityIcons 
              name="weather-partly-cloudy" 
              size={size} 
              color={color} 
            />;
          } else if (route.name === 'AICommute') {
            return <MaterialCommunityIcons 
              name={focused ? 'car' : 'car-outline'} 
              size={size} 
              color={color} 
            />;
          } else if (route.name === 'Settings') {
            return <MaterialCommunityIcons 
              name={focused ? 'cog' : 'cog-outline'} 
              size={size} 
              color={color} 
            />;
          }
        },
        tabBarActiveTintColor: '#4B9FE1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          headerTitle: 'WeatherWise',
        }}
      />
      <Tab.Screen 
        name="Forecast" 
        component={ForecastScreen} 
        options={{ 
          headerTitle: 'Forecast',
        }}
      />
      <Tab.Screen 
        name="AICommute" 
        component={AICommuteScreen} 
        options={{ 
          headerTitle: 'Commute AI',
          tabBarLabel: 'Commute'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
} 