import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header with Time and Icons */}
        <View style={styles.header}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="cloud-outline" size={24} color="#333" style={styles.headerIcon} />
            <Ionicons name="location-outline" size={24} color="#333" style={styles.headerIcon} />
            <Feather name="mic" size={24} color="#333" />
          </View>
        </View>

        {/* Main Temperature Display */}
        <View style={styles.temperatureContainer}>
          <View style={styles.mainInfo}>
            <Text style={styles.temperature}>72°F</Text>
            <Ionicons name="partly-sunny" size={80} color="#4B9FE1" style={styles.weatherIcon} />
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#555" />
            <Text style={styles.location}>San Francisco, CA</Text>
          </View>
          
          <Text style={styles.weatherCondition}>Partly Cloudy</Text>
        </View>

        {/* What if section */}
        <View style={styles.whatIfContainer}>
          <Text style={styles.whatIfTitle}>What if...</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="the temperature dropped 15°F..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Scenario options */}
          <View style={styles.scenarioOptions}>
            <View style={styles.scenarioItem}>
              <Text style={styles.scenarioText}>Rain increases by 80%</Text>
            </View>
            
            <View style={styles.scenarioItem}>
              <Text style={styles.scenarioText}>Temperature drops 15°F</Text>
            </View>
            
            <View style={styles.scenarioItem}>
              <Text style={styles.scenarioText}>Wind spikes to 25mph</Text>
            </View>
          </View>

          {/* Explore Button */}
          <TouchableOpacity style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>Explore Scenario</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  time: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 15,
  },
  temperatureContainer: {
    marginBottom: 40,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  temperature: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherIcon: {
    marginRight: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: '#555',
    marginLeft: 5,
  },
  weatherCondition: {
    fontSize: 16,
    color: '#555',
  },
  whatIfContainer: {
    flex: 1,
  },
  whatIfTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    padding: 5,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    padding: 10,
  },
  scenarioOptions: {
    marginBottom: 20,
  },
  scenarioItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  scenarioText: {
    fontSize: 16,
    color: '#4B9FE1',
  },
  exploreButton: {
    backgroundColor: '#4B9FE1',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 