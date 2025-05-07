import React, { createContext, useState, useContext, ReactNode } from 'react';

type WeatherContextType = {
  selectedCity: string | undefined;
  setSelectedCity: (city: string | undefined) => void;
};

// Create a context with a default value
const WeatherContext = createContext<WeatherContextType>({
  selectedCity: undefined,
  setSelectedCity: () => {},
});

// Props for the provider
type WeatherProviderProps = {
  children: ReactNode;
};

// Provider component
export const WeatherProvider = ({ children }: WeatherProviderProps) => {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  return (
    <WeatherContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </WeatherContext.Provider>
  );
};

// Custom hook to use the context
export const useWeatherContext = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
}; 