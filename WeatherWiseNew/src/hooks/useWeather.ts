import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { 
  fetchWeatherData, 
  fetchHourlyForecast, 
  fetchWeatherByCoordinates,
  fetchHourlyForecastByCoordinates,
  WeatherData, 
  HourlyForecast,
  Coordinates
} from '../services/weatherService';

export const useWeather = (city?: string) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Request location permissions and get current location
  useEffect(() => {
    const getLocationAsync = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status === 'granted') {
          const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          setLocation({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude
          });
        } else {
          // Default to San Francisco if permission not granted
          loadWeatherData('San Francisco');
        }
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Failed to get location. Using default location.');
        // Default to San Francisco if error getting location
        loadWeatherData('San Francisco');
      }
    };

    getLocationAsync();
  }, []);

  // Load weather data based on location or city
  useEffect(() => {
    if (city) {
      // If specific city is provided, use it
      loadWeatherData(city);
    } else if (location) {
      // If location is available, use coordinates
      loadWeatherDataByCoordinates(location);
    }
  }, [city, location]);

  // Load weather data by city name
  const loadWeatherData = async (cityName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [weather, forecast] = await Promise.all([
        fetchWeatherData(cityName),
        fetchHourlyForecast(cityName)
      ]);
      
      setWeatherData(weather);
      setHourlyForecast(forecast);
    } catch (err) {
      setError('Failed to load weather data. Please try again.');
      console.error('Error in useWeather:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load weather data by coordinates
  const loadWeatherDataByCoordinates = async (coords: Coordinates) => {
    setLoading(true);
    setError(null);
    
    try {
      const [weather, forecast] = await Promise.all([
        fetchWeatherByCoordinates(coords),
        fetchHourlyForecastByCoordinates(coords)
      ]);
      
      setWeatherData(weather);
      setHourlyForecast(forecast);
    } catch (err) {
      setError('Failed to load weather data. Please try again.');
      console.error('Error in useWeather with coordinates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh weather data
  const refreshWeather = async (cityName?: string) => {
    if (cityName) {
      await loadWeatherData(cityName);
    } else if (location) {
      await loadWeatherDataByCoordinates(location);
    } else if (weatherData?.name) {
      await loadWeatherData(weatherData.name);
    } else {
      await loadWeatherData('San Francisco');
    }
  };

  return {
    weatherData,
    hourlyForecast,
    loading,
    error,
    locationPermission,
    refreshWeather
  };
}; 