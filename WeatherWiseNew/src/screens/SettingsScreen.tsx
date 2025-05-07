import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

// Define the type for the renderSettingItem function props
type SettingItemProps = {
  icon: string;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  label: string;
  value: boolean | string;
  onPress: () => void;
  type?: 'toggle' | 'text';
  info?: string;
};

export default function SettingsScreen() {
  const {
    temperatureUnit,
    setTemperatureUnit,
    darkMode,
    setDarkMode,
    notificationsEnabled,
    setNotificationsEnabled,
    useLocation,
    setUseLocation,
  } = useSettings();

  const renderSettingItem = ({ 
    icon, 
    iconFamily = 'Ionicons', 
    label, 
    value, 
    onPress, 
    type = 'toggle',
    info,
  }: SettingItemProps) => {
    const IconComponent = iconFamily === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

    return (
      <TouchableOpacity 
        style={[styles.settingItem, { borderBottomColor: '#e0e0e0' }]} 
        onPress={onPress}
        disabled={type === 'toggle'}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(75, 159, 225, 0.1)' }]}>
            <IconComponent name={icon as any} size={22} color="#4B9FE1" />
          </View>
          <View>
            <Text style={[styles.settingLabel, { color: '#333' }]}>{label}</Text>
            {info && <Text style={[styles.settingInfo, { color: '#666' }]}>{info}</Text>}
          </View>
        </View>
        
        {type === 'toggle' && (
          <Switch
            value={value as boolean}
            onValueChange={onPress}
            trackColor={{ false: '#D1D1D6', true: '#4B9FE1' }}
            thumbColor={value ? '#fff' : '#fff'}
          />
        )}
        
        {type === 'text' && (
          <Text style={[styles.settingValue, { color: '#666' }]}>{value as string}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: '#ffffff', shadowColor: 'rgba(0, 0, 0, 0.1)' }]}>
          <Text style={[styles.sectionTitle, { color: '#333' }]}>General</Text>
          {renderSettingItem({
            icon: 'location',
            label: 'Use Current Location',
            value: useLocation,
            onPress: () => setUseLocation(!useLocation),
            info: 'Use device location',
          })}
          {renderSettingItem({
            icon: 'thermometer',
            iconFamily: 'MaterialCommunityIcons',
            label: 'Temperature Unit',
            value: temperatureUnit === 'celsius' ? '°C' : '°F',
            onPress: () => setTemperatureUnit(temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius'),
            type: 'text',
          })}
          {renderSettingItem({
            icon: 'notifications',
            label: 'Weather Alerts',
            value: notificationsEnabled,
            onPress: () => setNotificationsEnabled(!notificationsEnabled),
          })}
          {renderSettingItem({
            icon: 'moon',
            label: 'Dark Mode',
            value: darkMode,
            onPress: () => setDarkMode(!darkMode),
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    borderRadius: 15,
    marginHorizontal: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingInfo: {
    fontSize: 13,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
  },
}); 