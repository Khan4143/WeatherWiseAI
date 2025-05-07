/**
 * Weather utility functions
 */

// Convert wind speed from m/s to km/h
export const convertWindSpeed = (speed: number): number => {
  return Math.round(speed * 3.6);
};

// Get descriptive wind force based on speed in m/s
export const getWindForce = (speed: number): string => {
  const kmhSpeed = convertWindSpeed(speed);
  
  if (kmhSpeed < 1) return 'Calm';
  if (kmhSpeed < 6) return 'Light air';
  if (kmhSpeed < 12) return 'Light breeze';
  if (kmhSpeed < 20) return 'Gentle breeze';
  if (kmhSpeed < 29) return 'Moderate breeze';
  if (kmhSpeed < 39) return 'Fresh breeze';
  if (kmhSpeed < 50) return 'Strong breeze';
  if (kmhSpeed < 62) return 'High wind';
  if (kmhSpeed < 75) return 'Gale';
  if (kmhSpeed < 89) return 'Strong gale';
  if (kmhSpeed < 103) return 'Storm';
  if (kmhSpeed < 118) return 'Violent storm';
  return 'Hurricane';
};

// Get weather icon name based on condition
export const getWeatherIcon = (condition?: string): any => {
  if (!condition) return 'partly-sunny';
  
  const conditions: Record<string, any> = {
    'Clear': 'sunny',
    'Clouds': 'partly-sunny',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'thunderstorm',
    'Snow': 'snow',
    'Mist': 'cloud',
    'Smoke': 'cloud',
    'Haze': 'cloud',
    'Dust': 'cloud',
    'Fog': 'cloud',
    'Sand': 'cloud',
    'Ash': 'cloud',
    'Squall': 'thunderstorm',
    'Tornado': 'thunderstorm'
  };
  
  return conditions[condition] || 'partly-sunny';
};

// Format a date object to a readable time string
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Format timestamp to readable time
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return formatTime(date);
}; 