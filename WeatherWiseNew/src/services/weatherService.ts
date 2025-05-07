const API_KEY = '3e0617735a58569f29ff6a77f934a628';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
  sys: {
    country: string;
  };
  wind: {
    speed: number;
    deg: number;
  };
  dt: number;
}

export interface HourlyForecast {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    dt_txt: string;
    pop?: number;
  }>;
  city: {
    name: string;
    country: string;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const fetchWeatherData = async (city: string = 'San Francisco'): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Weather data not available');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const fetchWeatherByCoordinates = async (coords: Coordinates): Promise<WeatherData> => {
  try {
    const { latitude, longitude } = coords;
    const response = await fetch(
      `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Weather data not available');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data by coordinates:', error);
    throw error;
  }
};

export const fetchHourlyForecast = async (city: string = 'San Francisco'): Promise<HourlyForecast> => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?q=${city}&units=metric&cnt=40&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Forecast data not available');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
};

export const fetchHourlyForecastByCoordinates = async (coords: Coordinates): Promise<HourlyForecast> => {
  try {
    const { latitude, longitude } = coords;
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&cnt=40&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Forecast data not available');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching forecast data by coordinates:', error);
    throw error;
  }
}; 