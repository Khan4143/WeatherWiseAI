import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Linking,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useWeather } from '../hooks/useWeather';
import { getWeatherIcon, convertWindSpeed, formatTime, formatTimestamp } from '../utils/weatherUtils';
import { filterCities, validateCity } from '../utils/cityData';
import { useWeatherContext } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Temperature conversion function
const convertTemperature = (temp: number, unit: 'celsius' | 'fahrenheit'): number => {
  if (unit === 'fahrenheit') {
    return (temp * 9/5) + 32;
  }
  return temp; // Already in Celsius
};

// Component for hourly weather item
const HourlyItem = ({ time, temp, icon, condition, unit }: { time: string, temp: number, icon: string, condition: string, unit: 'celsius' | 'fahrenheit' }) => {
  const displayTemp = convertTemperature(temp, unit);
  
  return (
    <View style={[styles.hourlyItem, { opacity: 1 }]}>
      <Text style={styles.hourlyTime}>{time}</Text>
      <Image 
        source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }} 
        style={styles.hourlyIcon}
      />
      <Text style={styles.hourlyTemp}>{Math.round(displayTemp)}°</Text>
      <Text style={styles.hourlyCondition}>{condition}</Text>
    </View>
  );
};

export default function HomeScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('');
  const { selectedCity, setSelectedCity } = useWeatherContext();
  const { temperatureUnit, setTemperatureUnit } = useSettings();
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [validatedCities, setValidatedCities] = useState<{[key: string]: boolean}>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { weatherData, hourlyForecast, loading, error, locationPermission, refreshWeather } = useWeather(selectedCity);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // Weather scenarios state
  const [rainScenario, setRainScenario] = useState('Rain increases by 80%');
  const [tempScenario, setTempScenario] = useState('Temperature drops 15°C');
  const [windScenario, setWindScenario] = useState('Wind spikes to 25km/h');
  const [showScenarioDetails, setShowScenarioDetails] = useState(false);

  // Get weather theme based on current weather condition
  const weatherTheme = useMemo(() => {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      return {
        gradientColors: ['#f0f5ff', '#d0e5ff'] as any,
        textColor: '#333',
        iconsColor: '#4B9FE1',
        backgroundColor: '#f0f5ff',
        cardColor: 'transparent',
        shadowIntensity: 0,
        statusBarStyle: 'dark-content' as 'dark-content' | 'light-content'
      };
    }

    const condition = weatherData.weather[0].main.toLowerCase();
    const hours = new Date().getHours();
    const isNight = hours < 6 || hours > 18;

    // Default (Clear day)
    let theme = {
      gradientColors: ['#87CEEB', '#1E90FF'] as string[],
      textColor: '#333',
      iconsColor: '#4B9FE1',
      backgroundColor: '#f0f5ff',
      cardColor: 'transparent',
      shadowIntensity: 0,
      statusBarStyle: 'dark-content' as 'dark-content' | 'light-content'
    };

    // Night time
    if (isNight) {
      theme.gradientColors = ['#1c1c44', '#0f0c29'] as string[];
      theme.textColor = '#fff';
      theme.iconsColor = '#90caf9';
      theme.backgroundColor = '#1c1c44';
      theme.cardColor = 'transparent';
      theme.shadowIntensity = 0.2;
      theme.statusBarStyle = 'light-content';
    }

    // Condition-specific themes
    if (condition.includes('clear') && !isNight) {
      theme.gradientColors = ['#87CEEB', '#1E90FF'] as string[];
    } else if (condition.includes('cloud')) {
      theme.gradientColors = isNight 
        ? ['#202336', '#101522'] as string[]
        : ['#AEC6CF', '#89a5b3'] as string[];
      theme.backgroundColor = isNight ? '#202336' : '#AEC6CF';
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      theme.gradientColors = isNight 
        ? ['#1e2a3a', '#0d1218'] as string[]
        : ['#616f77', '#404e57'] as string[];
      theme.backgroundColor = isNight ? '#1e2a3a' : '#616f77';
      theme.textColor = '#fff';
      theme.statusBarStyle = 'light-content';
    } else if (condition.includes('thunderstorm')) {
      theme.gradientColors = isNight 
        ? ['#1a1a2e', '#0d0d16'] as string[]
        : ['#30336b', '#1e2030'] as string[];
      theme.backgroundColor = isNight ? '#1a1a2e' : '#30336b';
      theme.textColor = '#fff';
      theme.iconsColor = '#ffd700';
      theme.statusBarStyle = 'light-content';
    } else if (condition.includes('snow')) {
      theme.gradientColors = isNight 
        ? ['#2c3e50', '#1a252f'] as string[]
        : ['#e0e0e0', '#c8d6e5'] as string[];
      theme.backgroundColor = isNight ? '#2c3e50' : '#e0e0e0';
      theme.textColor = isNight ? '#fff' : '#333';
      theme.statusBarStyle = isNight ? 'light-content' : 'dark-content';
    } else if (condition.includes('mist') || condition.includes('fog')) {
      theme.gradientColors = isNight 
        ? ['#29323c', '#171c21'] as string[]
        : ['#b8c6db', '#969faf'] as string[];
      theme.backgroundColor = isNight ? '#29323c' : '#b8c6db';
      theme.textColor = isNight ? '#fff' : '#333';
      theme.statusBarStyle = isNight ? 'light-content' : 'dark-content';
    }
    
    return theme;
  }, [weatherData]);

  // Generate hourly data for display
  const hourlyData = useMemo(() => {
    if (!hourlyForecast || !hourlyForecast.list || hourlyForecast.list.length === 0) {
      return [];
    }

    const now = new Date();
    let hourlyPoints = [];
    
    // Add the current hour using current weather data
    if (weatherData) {
      hourlyPoints.push({
        time: formatTime(now),
        temp: weatherData.main.temp,
        icon: weatherData.weather[0].icon,
        condition: weatherData.weather[0].main
      });
    }
    
    // Take all forecast items and filter for next 24 hours
    const forecastItems = hourlyForecast.list
      .filter(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate > now && itemDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
      });
    
    const forecastPoints = forecastItems.map(item => ({
      time: formatTime(new Date(item.dt * 1000)),
      temp: item.main.temp,
      icon: item.weather[0].icon,
      condition: item.weather[0].main
    }));
    
    return [...hourlyPoints, ...forecastPoints];
  }, [weatherData, hourlyForecast]);
  
  // Navigation helper
  const navigateToAICommute = () => {
    navigation.navigate('AICommute');
  };

  // Request location permissions
  const handleRequestLocationPermission = () => {
    Alert.alert(
      "Location Access Required",
      "This app needs access to your location to show local weather. Please go to settings and enable location permissions.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() }
      ]
    );
  };

  // Update weather scenarios based on actual data
  useEffect(() => {
    if (weatherData) {
      // Rain scenario - check for precipitation probability
      const hasRain = weatherData.weather.some(w => 
        w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm');
      
      if (hasRain) {
        setRainScenario('Rain intensity increases by 80%');
      } else {
        setRainScenario('Sudden rainfall begins');
      }
      
      // Temperature scenario - calculate a drop of ~8°C
      const currentTemp = weatherData.main.temp;
      const tempDrop = Math.round(currentTemp - 8);
      setTempScenario(`Temperature drops to ${tempDrop}°C`);
      
      // Wind scenario - increase current wind by ~10km/h
      const currentWind = weatherData.wind.speed;
      const windIncrease = convertWindSpeed(currentWind + 10);
      setWindScenario(`Wind spikes to ${windIncrease} km/h`);
    }
  }, [weatherData]);

  // Validate a batch of cities
  const validateCitiesBatch = useCallback(async (cities: string[]) => {
    // Skip validation if already validating
    if (isValidating) return;
    
    setIsValidating(true);
    const validationResults: {[key: string]: boolean} = {};
    
    // Filter out cities that have already been validated
    const citiesToValidate = cities.filter(city => validatedCities[city] === undefined);
    
    // Skip if there's nothing to validate
    if (citiesToValidate.length === 0) {
      setIsValidating(false);
      return;
    }
    
    // Process cities in batches to avoid rate limiting
    for (const city of citiesToValidate) {
      try {
        const isValid = await validateCity(city);
        validationResults[city] = isValid;
      } catch (error) {
        console.error(`Error validating city ${city}:`, error);
        validationResults[city] = false;
      }
    }
    
    setValidatedCities(prev => ({...prev, ...validationResults}));
    setIsValidating(false);
  }, [validatedCities, isValidating]);

  // Update city suggestions when search text changes
  useEffect(() => {
    // Helper function for validation to avoid dependency issues
    const handleCityValidation = (cities: string[]) => {
      if (cities.length > 0 && !isValidating) {
        validateCitiesBatch(cities);
      }
    };
    
    if (searchText.trim().length > 0) {
      const suggestions = filterCities(searchText);
      setCitySuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
      // Validate the suggestions with a small delay to prevent rapid validation calls
      const timeoutId = setTimeout(() => {
        handleCityValidation(suggestions);
      }, 300);
      
      // Cleanup the timeout
      return () => clearTimeout(timeoutId);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchText, isValidating, validateCitiesBatch]);

  const handleSearch = () => {
    if (searchText.trim()) {
      setSelectedCity(searchText);
      setSearchText('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (selectedSuggestion: string) => {
    setSelectedCity(selectedSuggestion);
    setSearchText('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather(selectedCity);
    setRefreshing(false);
  };

  // Handle scenario exploration
  const handleExploreScenario = () => {
    setShowScenarioDetails(true);
  };

  // Get current time
  const getCurrentTime = () => {
    return formatTime(new Date());
  };

  // Add this function to generate dynamic commute impact messages
  const generateCommuteImpact = () => {
    if (!weatherData) return {
      title: "Commute Impact",
      description: "Loading weather data to analyze commute impact..."
    };

    const { weather, main, wind } = weatherData;
    const weatherCondition = weather[0]?.main?.toLowerCase() || '';
    const temperature = main.temp;
    const windSpeed = wind.speed;
    
    // Default impact
    let impact = {
      title: "Commute Impact",
      description: "Normal commuting conditions. No significant delays expected."
    };
    
    // Check for severe weather conditions
    if (weatherCondition.includes('thunderstorm') || weatherCondition.includes('tornado')) {
      impact.description = "Severe weather alert! Consider postponing travel or working from home if possible.";
    } 
    // Rain conditions
    else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
      if (windSpeed > 10) {
        impact.description = "Rain with strong winds. Expect slippery roads and potential traffic delays of 15-25 minutes.";
      } else {
        impact.description = "Wet conditions. Allow 10-15 extra minutes for your commute and drive cautiously.";
      }
    } 
    // Snow conditions
    else if (weatherCondition.includes('snow')) {
      impact.description = "Snowy conditions. Significant delays likely. Consider alternative routes or public transportation.";
    } 
    // Fog conditions
    else if (weatherCondition.includes('mist') || weatherCondition.includes('fog')) {
      impact.description = "Reduced visibility. Drive slowly and maintain safe distance. Expect 10-20 minute delays.";
    } 
    // Wind conditions
    else if (windSpeed > 12) {
      impact.description = "Strong winds may affect vehicle stability. Allow extra travel time, especially for high-profile vehicles.";
    } 
    // Extreme temperature conditions
    else if (temperature > 35) {
      impact.description = "Extreme heat may cause vehicle issues. Check cooling system and carry water. Traffic normal.";
    } 
    else if (temperature < 0) {
      impact.description = "Freezing temperatures. Watch for icy patches. Allow 5-10 extra minutes for your journey.";
    } 
    // Clear/good conditions
    else if (weatherCondition.includes('clear') || weatherCondition.includes('sun')) {
      impact.description = "Ideal commuting conditions. Traffic flowing normally with no weather-related delays.";
    } 
    // Cloudy but otherwise normal
    else if (weatherCondition.includes('cloud')) {
      impact.description = "Overcast but dry. Normal commuting conditions expected with standard traffic patterns.";
    }
    
    return impact;
  };

  const renderLocationPermissionView = () => {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="location-outline" size={60} color="#4B9FE1" />
        <Text style={styles.permissionTitle}>Location Access Needed</Text>
        <Text style={styles.permissionText}>
          WeatherWise needs access to your location to show local weather information.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={handleRequestLocationPermission}
        >
          <Text style={styles.permissionButtonText}>Enable Location Access</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderScenarioDetailsView = () => {
    if (!showScenarioDetails) return null;
    
    // Get dynamic commute impact
    const commuteImpact = generateCommuteImpact();
    
    return (
      <View style={styles.scenarioDetailsContainer}>
        <View style={styles.scenarioHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setShowScenarioDetails(false)}
          >
            <Ionicons name="chevron-back-outline" size={24} color="#333" />
            <Text style={styles.scenarioHeaderTitle}>Weather Scenario</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.impactContainer}>
          <View style={styles.impactItem}>
            <View style={[styles.impactIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="car" size={20} color="#4B9FE1" />
            </View>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>{commuteImpact.title}</Text>
              <Text style={styles.impactDescription}>
                {commuteImpact.description}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.aiCommuteButton}
          onPress={navigateToAICommute}
        >
          <FontAwesome5 name="robot" size={16} color="#fff" style={styles.aiButtonIcon} />
          <Text style={styles.aiCommuteButtonText}>Get AI Commute Assistance</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWeatherContent = () => {
    if (showScenarioDetails) {
      return renderScenarioDetailsView();
    }
    
    if (locationPermission === false) {
      return renderLocationPermissionView();
    }

    if (loading) {
      return (
        <View style={[styles.loadingContainer, {backgroundColor: weatherTheme.backgroundColor}]}>
          <ActivityIndicator size="large" color={weatherTheme.iconsColor} />
          <Text style={[styles.loadingText, {color: weatherTheme.textColor}]}>Loading weather data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.errorContainer, {backgroundColor: weatherTheme.backgroundColor}]}>
          <Ionicons name="cloud-offline" size={60} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => refreshWeather(selectedCity)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {/* Main Temperature Display */}
        <View style={styles.temperatureContainer}>
          <View style={styles.mainInfo}>
            <View style={styles.temperatureWrapper}>
              <Text style={[styles.temperature, {color: weatherTheme.textColor}]}>
                {weatherData?.main?.temp 
                  ? Math.round(convertTemperature(weatherData.main.temp, temperatureUnit)) 
                  : 0}°
              </Text>
              
              {/* Temperature Unit Toggle */}
              <TouchableOpacity 
                style={styles.unitToggle}
                onPress={() => setTemperatureUnit(temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius')}
              >
                <Text style={[styles.unitText, {color: weatherTheme.textColor, fontWeight: 'bold'}]}>
                  {temperatureUnit === 'celsius' ? 'C' : 'F'}
                </Text>
                <MaterialCommunityIcons 
                  name="toggle-switch" 
                  size={22} 
                  color={weatherTheme.iconsColor} 
                />
              </TouchableOpacity>
            </View>
            
            <Ionicons 
              name={getWeatherIcon(weatherData?.weather?.[0]?.main)} 
              size={80} 
              color={weatherTheme.iconsColor} 
              style={styles.weatherIcon} 
            />
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={weatherTheme.textColor} />
            <Text style={[styles.location, {color: weatherTheme.textColor}]}>
              {weatherData?.name}, {weatherData?.sys?.country}
            </Text>
          </View>
          
          <Text style={[styles.weatherCondition, {color: weatherTheme.textColor}]}>
            {weatherData?.weather?.[0]?.main || 'Unknown'}
          </Text>
        </View>

        {/* Hourly Forecast Section */}
        <View style={styles.hourlyForecastContainer}>
          <Text style={[styles.hourlyForecastTitle, {color: weatherTheme.textColor}]}>
            Hourly Forecast
          </Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyScrollView}
            contentContainerStyle={styles.hourlyScrollContent}
            decelerationRate={0.95}
            snapToInterval={width * 0.22 + 16}
            snapToAlignment="center"
            scrollEventThrottle={16}
            pagingEnabled={false}
            bounces={true}
            alwaysBounceHorizontal={true}
            overScrollMode="always"
          >
            {hourlyData.map((item, index) => (
              <HourlyItem
                key={index}
                time={item.time}
                temp={item.temp}
                icon={item.icon}
                condition={item.condition}
                unit={temperatureUnit}
              />
            ))}
          </ScrollView>
        </View>

        {/* What if section */}
        <View style={[styles.whatIfContainer, {
          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: 20,
          padding: 20,
          marginTop: 20,
          marginBottom: 20,
        }]}>
          <Text style={[styles.whatIfTitle, {color: weatherTheme.textColor}]}>What if...</Text>
          
          {/* Scenario options */}
          <View style={styles.scenarioOptions}>
            <TouchableOpacity style={[styles.scenarioItem, {backgroundColor: 'rgba(255, 255, 255, 0.4)'}]}>
              <MaterialCommunityIcons name="weather-pouring" size={22} color={weatherTheme.iconsColor} style={styles.scenarioIcon} />
              <Text style={[styles.scenarioText, {color: weatherTheme.textColor}]}>{rainScenario}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.scenarioItem, {backgroundColor: 'rgba(255, 255, 255, 0.4)'}]}>
              <MaterialCommunityIcons name="thermometer-low" size={22} color={weatherTheme.iconsColor} style={styles.scenarioIcon} />
              <Text style={[styles.scenarioText, {color: weatherTheme.textColor}]}>{tempScenario}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.scenarioItem, {backgroundColor: 'rgba(255, 255, 255, 0.4)'}]}>
              <Feather name="wind" size={22} color={weatherTheme.iconsColor} style={styles.scenarioIcon} />
              <Text style={[styles.scenarioText, {color: weatherTheme.textColor}]}>{windScenario}</Text>
            </TouchableOpacity>
          </View>

          {/* Explore Button */}
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={handleExploreScenario}
          >
            <Text style={styles.exploreButtonText}>Explore Scenario</Text>
          </TouchableOpacity>
          
          {/* Impact Preview - below the explore button */}
          <View style={styles.impactPreviewContainer}>
            <TouchableOpacity 
              style={[styles.impactPreviewItem, {backgroundColor: 'rgba(255, 255, 255, 0.4)'}]}
              onPress={handleExploreScenario}
            >
              <View style={styles.impactPreviewIcon}>
                <FontAwesome5 name="car" size={20} color={weatherTheme.iconsColor} />
              </View>
              <View style={styles.impactPreviewContent}>
                <Text style={[styles.impactPreviewTitle, {color: weatherTheme.textColor}]}>{generateCommuteImpact().title}</Text>
                <Text style={[styles.impactPreviewDescription, {color: weatherTheme.textColor === '#fff' ? '#ddd' : '#666'}]}>
                  {generateCommuteImpact().description}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* AI Commute Button */}
            <TouchableOpacity 
              style={styles.aiCommuteButton}
              onPress={navigateToAICommute}
            >
              <FontAwesome5 name="robot" size={16} color="#fff" style={styles.aiButtonIcon} />
              <Text style={styles.aiCommuteButtonText}>Get AI Commute Assistance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      if (!showSearchBar) {
        setShowSuggestions(false);
      }
    }}>
      <LinearGradient
        colors={weatherTheme.gradientColors as any}
        style={{flex: 1, width: '100%'}}
      >
        <SafeAreaView style={[styles.container, {backgroundColor: 'transparent', paddingHorizontal: 0}]} edges={['top']}>
          <StatusBar barStyle={weatherTheme.statusBarStyle} />
          
          {/* Create a compact container for search elements */}
          <View style={styles.searchComponentsContainer}>
            {/* Header with Search and Settings Icons */}
            <View style={styles.header}>
              {!showSearchBar ? (
                <TouchableOpacity 
                  style={styles.searchIconButton} 
                  onPress={() => setShowSearchBar(true)}
                >
                  <MaterialCommunityIcons 
                    name="magnify" 
                    size={28} 
                    color={weatherTheme.iconsColor} 
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a city..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    autoFocus={true}
                  />
                  <TouchableOpacity 
                    style={styles.searchButton} 
                    onPress={handleSearch}
                  >
                    <MaterialCommunityIcons 
                      name="magnify" 
                      size={24} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.closeSearchButton} 
                    onPress={() => {
                      setShowSearchBar(false);
                      setSearchText('');
                      setShowSuggestions(false);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* City suggestions as absolute positioned dropdown */}
            {showSuggestions && showSearchBar && (
              <View style={styles.suggestionsContainer}>
                {isValidating && citySuggestions.length === 0 && (
                  <View style={styles.validatingContainer}>
                    <ActivityIndicator size="small" color="#4B9FE1" />
                    <Text style={styles.validatingText}>Checking cities...</Text>
                  </View>
                )}
                
                {citySuggestions
                  .filter(city => 
                    validatedCities[city] === undefined || validatedCities[city] === true
                  )
                  .map(item => (
                    <TouchableOpacity 
                      key={item}
                      style={styles.suggestionItem} 
                      onPress={() => {
                        handleSuggestionPress(item);
                        setShowSearchBar(false);
                      }}
                    >
                      <MaterialCommunityIcons name="map-marker" size={16} color="#4B9FE1" />
                      <Text style={styles.suggestionText}>{item}</Text>
                      {validatedCities[item] === undefined && (
                        <ActivityIndicator size="small" color="#4B9FE1" style={styles.suggestionLoader} />
                      )}
                    </TouchableOpacity>
                  ))}
                  
                {!isValidating && 
                  citySuggestions.filter(city => 
                    validatedCities[city] === undefined || validatedCities[city] === true
                  ).length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No matching cities found</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                progressViewOffset={20}
              />
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
            overScrollMode="always"
            scrollEventThrottle={16}
            style={styles.scrollView}
            nestedScrollEnabled={true}
          >
            {renderWeatherContent()}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  time: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerIcon: {
    marginRight: 15,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4B9FE1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4B9FE1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  temperatureWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperature: {
    fontSize: 100,
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
    fontSize: 18,
    color: '#555',
    marginTop: 5,
  },
  whatIfContainer: {
    width: '100%',
    marginVertical: 20,
    paddingVertical: 10,
  },
  whatIfTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  closeSearchButton: {
    padding: 8,
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 230,
    zIndex: 1001,
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  validatingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  suggestionLoader: {
    marginLeft: 5,
  },
  noResultsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  scenarioOptions: {
    marginBottom: 20,
  },
  scenarioItem: {
    padding: 15,
    borderRadius: 12,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioIcon: {
    marginRight: 10,
  },
  scenarioText: {
    fontSize: 16,
    color: '#4B9FE1',
    flex: 1,
  },
  exploreButton: {
    backgroundColor: '#4B9FE1',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Impact Preview Styles
  impactPreviewContainer: {
    marginTop: 5,
    marginBottom: 30,
  },
  impactPreviewItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  impactPreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  impactPreviewContent: {
    flex: 1,
  },
  impactPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  impactPreviewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // AI Commute Button styles
  aiCommuteButton: {
    flexDirection: 'row',
    backgroundColor: '#5E60CE',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  aiButtonIcon: {
    marginRight: 8,
  },
  aiCommuteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Scenario Details Page Styles
  scenarioDetailsContainer: {
    flex: 1,
  },
  scenarioHeader: {
    marginBottom: 25,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 5,
  },
  impactContainer: {
    marginBottom: 25,
  },
  impactItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 100,
    marginHorizontal: 5,
  },
  impactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  impactDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  adjustButton: {
    backgroundColor: '#4B9FE1',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIconButton: {
    padding: 5,
  },
  searchComponentsContainer: {
    width: '100%',
    zIndex: 1,
  },
  // Hourly forecast styles
  hourlyForecastContainer: {
    marginVertical: 20,
    paddingVertical: 10,
    width: '100%',
  },
  hourlyForecastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
    color: '#333',
  },
  hourlyScrollView: {
    flexGrow: 0,
    height: 160,
  },
  hourlyScrollContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
    paddingRight: 30,
  },
  hourlyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.22,
    height: 140,
    marginHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  hourlyTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    opacity: 0.9,
  },
  hourlyTemp: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  hourlyCondition: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 3,
  },
  hourlyIcon: {
    width: 50,
    height: 50,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  searchButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unitText: {
    fontSize: 16,
    marginRight: 4,
  },
}); 