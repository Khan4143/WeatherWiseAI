// List of major world cities for search suggestions
export const popularCities: string[] = [
  // Global major cities
  'New York',
  'London',
  'Paris',
  'Tokyo',
  'Sydney',
  'Dubai',
  'Singapore',
  'Hong Kong',
  'Berlin',
  'Madrid',
  'Rome',
  'Moscow',
  'Beijing',
  'Mumbai',
  'Toronto',
  'Los Angeles',
  'Chicago',
  'San Francisco',
  'Barcelona',
  'Amsterdam',
  'Bangkok',
  'Seoul',
  'Mexico City',
  'Cairo',
  'Rio de Janeiro',
  'Istanbul',
  'Vienna',
  'Stockholm',
  'Zurich',
  'Copenhagen',
  'Miami',
  'Seattle',
  'Vancouver',
  'Boston',
  'Milan',
  'Melbourne',
  'Auckland',
  'Dublin',
  'Prague',
  'Brussels',
  'Kuala Lumpur',
  'Johannesburg',
  'Buenos Aires',
  'Santiago',
  'Athens',
  'Warsaw',
  'Budapest',
  'Helsinki',
  'Lisbon',
  'Oslo',
  
  // Pakistan cities
  'Islamabad',
  'Lahore',
  'Karachi',
  'Peshawar',
  'Quetta',
  'Multan',
  'Faisalabad',
  'Rawalpindi',
  'Sialkot',
  'Mingora',
  'Hyderabad',
  'Gujranwala',
  'Abbottabad',
  'Sargodha',
  'Bahawalpur',

  // India cities
  'Mumbai',
  'New Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  
  // US cities
  'Houston',
  'Phoenix',
  'Philadelphia',
  'Dallas',
  'Austin',
  'Detroit',
  'Denver',
  'Atlanta',
  'Portland',
  'Las Vegas',
  
  // UK cities
  'Manchester',
  'Birmingham',
  'Glasgow',
  'Liverpool',
  'Edinburgh',
  'Leeds',
  'Bristol',
  'Sheffield',
  'Newcastle',
  'Belfast'
];

// Cache for validated cities
let validatedCities: { [key: string]: boolean } = {};

// Filter cities based on search input
export const filterCities = (search: string): string[] => {
  if (!search.trim()) return [];
  
  const searchLower = search.toLowerCase().trim();
  return popularCities.filter(city => 
    city.toLowerCase().includes(searchLower)
  ).slice(0, 5); // Limit to 5 suggestions
};

// Check if a city is valid in the OpenWeatherMap API
export const validateCity = async (city: string): Promise<boolean> => {
  // If we've already validated this city, return the cached result
  if (validatedCities[city] !== undefined) {
    return validatedCities[city];
  }
  
  try {
    const API_KEY = '3e0617735a58569f29ff6a77f934a628';
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`
    );
    
    const isValid = response.ok;
    // Cache the result
    validatedCities[city] = isValid;
    return isValid;
  } catch (error) {
    console.error(`Error validating city ${city}:`, error);
    return false;
  }
}; 