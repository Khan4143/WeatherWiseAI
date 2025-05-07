import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWeather } from '../hooks/useWeather';
import { useWeatherContext } from '../context/WeatherContext';

// Utility function to format dates for daily forecast
const formatDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Utility function to get just the date from dt_txt
const getDatePart = (dt_txt: string): string => {
  return dt_txt.split(' ')[0];
};

// Utility function to format hours
const formatHour = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

// Props for the horizontal hourly forecast item
type HourlyItemProps = {
  time: string;
  temp: number;
  icon: string;
  condition: string;
};

// Hourly forecast item component
const HourlyItem = ({ time, temp, icon, condition }: HourlyItemProps) => {
  return (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{time}</Text>
      <Image 
        source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }} 
        style={styles.hourlyIcon}
      />
      <Text style={styles.hourlyTemp}>{Math.round(temp)}°</Text>
      <Text style={styles.hourlyCondition}>{condition}</Text>
    </View>
  );
};

// Props for the daily forecast item
type DailyItemProps = {
  day: string;
  tempMax: number;
  tempMin: number;
  icon: string;
  condition: string;
  pop: number;
};

// Daily forecast item component
const DailyItem = ({ day, tempMax, tempMin, icon, condition, pop }: DailyItemProps) => {
  return (
    <View style={styles.dailyItem}>
      <Text style={styles.dailyDay}>{day}</Text>
      <View style={styles.dailyIconContainer}>
        <Image 
          source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }} 
          style={styles.dailyIcon}
        />
        {pop > 0 && (
          <View style={styles.popContainer}>
            <MaterialCommunityIcons name="water" size={14} color="#4B9FE1" />
            <Text style={styles.popText}>{Math.round(pop * 100)}%</Text>
          </View>
        )}
      </View>
      <View style={styles.dailyTempContainer}>
        <Text style={styles.dailyMaxTemp}>{Math.round(tempMax)}°</Text>
        <Text style={styles.dailyMinTemp}>{Math.round(tempMin)}°</Text>
      </View>
      <Text style={styles.dailyCondition}>{condition}</Text>
    </View>
  );
};

// Interface for interpolated hourly data
interface HourlyDataPoint {
  time: Date;
  temp: number;
  icon: string;
  condition: string;
}

// Type for the daily data reducer
interface DailyDataItem {
  temps: number[];
  icons: string[];
  conditions: string[];
  pop: number;
}

export default function ForecastScreen() {
  const { selectedCity } = useWeatherContext();
  const { weatherData, hourlyForecast, loading, error, refreshWeather } = useWeather(selectedCity);
  const [refreshing, setRefreshing] = useState(false);

  // Generate hourly data by interpolating between 3-hour intervals
  const hourlyData = useMemo(() => {
    if (!hourlyForecast || !hourlyForecast.list || hourlyForecast.list.length === 0) {
      return [];
    }

    const now = new Date();
    const hourlyPoints: HourlyDataPoint[] = [];
    
    // Add the current hour using current weather data if available
    if (weatherData) {
      hourlyPoints.push({
        time: now,
        temp: weatherData.main.temp,
        icon: weatherData.weather[0].icon,
        condition: weatherData.weather[0].main
      });
    }
    
    // Get the forecast data with 3-hour intervals
    const forecastPoints = hourlyForecast.list.map(item => ({
      time: new Date(item.dt * 1000),
      temp: item.main.temp,
      icon: item.weather[0].icon,
      condition: item.weather[0].main
    }));
    
    // Get the next 23 hours (for a total of 24 hours including the current hour)
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 23);
    
    // Generate an array of all hours between now and the end time
    const allHours: Date[] = [];
    for (let i = 1; i <= 23; i++) {
      const hourTime = new Date(now);
      hourTime.setHours(hourTime.getHours() + i);
      // Set the minutes and seconds to 0 for clean hour marks
      hourTime.setMinutes(0);
      hourTime.setSeconds(0);
      allHours.push(hourTime);
    }
    
    // For each hour, find the closest forecast points and interpolate
    allHours.forEach(hour => {
      // Find the two closest forecast points
      let beforePoint: HourlyDataPoint | null = null;
      let afterPoint: HourlyDataPoint | null = null;
      
      for (const point of forecastPoints) {
        if (point.time <= hour) {
          // This point is before or equal to the target hour
          if (!beforePoint || point.time > beforePoint.time) {
            beforePoint = point;
          }
        } else {
          // This point is after the target hour
          if (!afterPoint || point.time < afterPoint.time) {
            afterPoint = point;
          }
        }
      }
      
      // If we have both before and after points, interpolate
      if (beforePoint && afterPoint) {
        const totalTimeDiff = afterPoint.time.getTime() - beforePoint.time.getTime();
        const hourTimeDiff = hour.getTime() - beforePoint.time.getTime();
        const ratio = hourTimeDiff / totalTimeDiff;
        
        // Linear interpolation of temperature
        const temp = beforePoint.temp + (afterPoint.temp - beforePoint.temp) * ratio;
        
        // Use the closest point's icon and condition
        const closestPoint = ratio < 0.5 ? beforePoint : afterPoint;
        
        hourlyPoints.push({
          time: hour,
          temp,
          icon: closestPoint.icon,
          condition: closestPoint.condition
        });
      } 
      // If we only have a before point, use that
      else if (beforePoint) {
        hourlyPoints.push({
          time: hour,
          temp: beforePoint.temp,
          icon: beforePoint.icon,
          condition: beforePoint.condition
        });
      }
      // If we only have an after point, use that
      else if (afterPoint) {
        hourlyPoints.push({
          time: hour,
          temp: afterPoint.temp,
          icon: afterPoint.icon,
          condition: afterPoint.condition
        });
      }
    });
    
    // Sort by time and take only the first 24 hours
    return hourlyPoints.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 24);
  }, [weatherData, hourlyForecast]);

  // Process hourly forecast data to create daily forecast
  const dailyData = useMemo(() => {
    if (!hourlyForecast || !hourlyForecast.list) return [];

    const dailyMap = new Map();
    
    // Group forecast items by day
    hourlyForecast.list.forEach(item => {
      const date = getDatePart(item.dt_txt);
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          temps: [item.main.temp],
          icons: [item.weather[0].icon],
          conditions: [item.weather[0].main],
          pop: item.pop ? item.pop : 0,
        });
      } else {
        const day = dailyMap.get(date);
        day.temps.push(item.main.temp);
        day.icons.push(item.weather[0].icon);
        day.conditions.push(item.weather[0].main);
        
        // Update pop if it's higher than current value
        if (item.pop && item.pop > day.pop) {
          day.pop = item.pop;
        }
      }
    });
    
    // Convert map to array and calculate min/max temps
    return Array.from(dailyMap.entries()).map(([date, data]) => {
      const temps = data.temps;
      const tempMax = Math.max(...temps);
      const tempMin = Math.min(...temps);
      
      // Get most common condition and icon
      const conditionCounts: Record<string, number> = data.conditions.reduce((acc: Record<string, number>, condition: string) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const iconCounts: Record<string, number> = data.icons.reduce((acc: Record<string, number>, icon: string) => {
        acc[icon] = (acc[icon] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonCondition = Object.entries(conditionCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      const mostCommonIcon = Object.entries(iconCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        date,
        day: formatDay(date),
        tempMax,
        tempMin,
        icon: mostCommonIcon,
        condition: mostCommonCondition,
        pop: data.pop || 0,
      };
    });
  }, [hourlyForecast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather(selectedCity);
    setRefreshing(false);
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9FE1" />
          <Text style={styles.loadingText}>Loading forecast data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="weather-cloudy-alert" size={60} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4B9FE1"]}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            Weather Forecast
          </Text>
          <Text style={styles.subtitle}>
            {hourlyForecast?.city?.name || weatherData?.name}, 
            {hourlyForecast?.city?.country || weatherData?.sys?.country}
          </Text>
        </View>

        {/* Hourly Forecast Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next 24 Hours</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyScrollView}
            contentContainerStyle={styles.hourlyScrollContent}
          >
            {hourlyData.map((item, index) => (
              <HourlyItem
                key={index}
                time={formatHour(item.time)}
                temp={item.temp}
                icon={item.icon}
                condition={item.condition}
              />
            ))}
          </ScrollView>
        </View>

        {/* Daily Forecast Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          {dailyData.map((item) => (
            <DailyItem
              key={item.date}
              day={item.day}
              tempMax={item.tempMax}
              tempMin={item.tempMin}
              icon={item.icon}
              condition={item.condition}
              pop={item.pop}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  
  // Section styles
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  
  // Hourly forecast styles
  hourlyScrollView: {
    marginBottom: 5,
  },
  hourlyScrollContent: {
    paddingRight: 10,
  },
  hourlyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    width: 75,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hourlyTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  hourlyIcon: {
    width: 45,
    height: 45,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  hourlyCondition: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginTop: 3,
  },
  
  // Daily forecast styles
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyDay: {
    width: '25%',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dailyIconContainer: {
    width: '20%',
    alignItems: 'center',
    position: 'relative',
  },
  dailyIcon: {
    width: 50,
    height: 50,
  },
  dailyTempContainer: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dailyMaxTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dailyMinTemp: {
    fontSize: 16,
    color: '#888',
    marginLeft: 8,
  },
  dailyCondition: {
    width: '25%',
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  popContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  popText: {
    fontSize: 10,
    color: '#4B9FE1',
    marginLeft: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
}); 