import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useWeather } from '../hooks/useWeather';
import { useWeatherContext } from '../context/WeatherContext';

// Replace Hugging Face API key with Google's Gemini API key
const GEMINI_API_KEY = 'AIzaSyD_q6fRHQr7nOnEOp78SB4TBd4S09DVrD8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// Predefined questions that users can select - adding "as const" for TypeScript
const PREDEFINED_QUESTIONS = [
  {
    id: '1',
    text: "How long will my commute take today?",
    icon: "time-outline" as const
  },
  {
    id: '2',
    text: "What's the best route to take?",
    icon: "map-outline" as const
  },
  {
    id: '3',
    text: "When should I leave for work?",
    icon: "alarm-outline" as const
  },
  {
    id: '4',
    text: "Will rain affect my commute?",
    icon: "rainy-outline" as const
  },
  {
    id: '5',
    text: "Is it safe to walk in this weather?",
    icon: "walk-outline" as const
  },
  {
    id: '6',
    text: "Should I take public transport today?",
    icon: "bus-outline" as const
  }
];

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

// Add this type definition for hourly data
type HourlyWeatherData = {
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
};

// Enhanced AI response function using Gemini API with forecast data
const getAIResponse = async (
  message: string, 
  weatherCondition?: string, 
  temperature?: number,
  travelMode: string = 'car',
  weatherData?: any,
  hourlyForecast?: any
): Promise<string> => {
  try {
    console.log("Calling Gemini API with forecast data");
    console.log("Weather data available:", !!weatherData);
    console.log("Weather condition:", weatherCondition);
    console.log("Temperature:", temperature);
    console.log("Hourly forecast available:", !!hourlyForecast?.list);
    
    // Modify the check to be more precise about when to use default data
    // Only use default weather if we have empty strings or undefined
    const needsDefaultWeather = (
      weatherCondition === undefined || 
      weatherCondition === "" || 
      temperature === undefined || 
      isNaN(temperature)
    );
    
    console.log("Using default weather?", needsDefaultWeather);
    
    // Use default weather if needed, but be more specific about when to use defaults
    const currentWeather = (!needsDefaultWeather && weatherCondition) ? weatherCondition : "Clear";
    const currentTemp = (!needsDefaultWeather && temperature !== undefined && !isNaN(temperature)) ? temperature : 22;
    
    console.log("Final weather being used:", currentWeather);
    console.log("Final temperature being used:", currentTemp);
    
    // Get forecast data for the next 3 hours if available
    let forecastData = '';
    if (hourlyForecast?.list && hourlyForecast.list.length > 0) {
      // Extract the next 3 hours of forecast data
      const nextThreeHours = hourlyForecast.list.slice(0, 3);
      forecastData = nextThreeHours.map((hour: HourlyWeatherData) => {
        // Extract time from dt_txt which is in format "YYYY-MM-DD HH:MM:SS"
        const timeStr = hour.dt_txt.split(' ')[1].substring(0, 5); // Gets HH:MM
        return `- ${timeStr}: ${hour.weather[0].main}, ${Math.round(hour.main.temp)}°C`;
      }).join('\n');
    } else if (needsDefaultWeather) {
      // Create sample forecast data if real data is unavailable
      const now = new Date();
      forecastData = [1, 2, 3].map(hour => {
        const time = new Date(now);
        time.setHours(time.getHours() + hour);
        return `- ${time.getHours().toString().padStart(2, '0')}:00: ${currentWeather}, ${Math.round(currentTemp)}°C`;
      }).join('\n');
    }
    
    // Create a detailed prompt with current and forecast weather context
    const promptContent = `
You are WeatherWise's commute assistant that provides personalized advice about commuting in different weather conditions.

CURRENT CONTEXT:
- Current Weather: ${currentWeather}
- Current Temperature: ${Math.round(currentTemp)}°C
- User's travel mode: ${travelMode}
- User's message: "${message}"
${needsDefaultWeather ? '- NOTE: Using default weather data as actual data is unavailable' : ''}

FORECAST FOR NEXT 3 HOURS:
${forecastData || 'Forecast data not available'}

YOUR BEHAVIOR:
1. Always provide specific, actionable advice that directly answers the user's question
2. Include relevant weather impact on their journey, considering BOTH current and forecast conditions
3. If weather is changing in the next 3 hours, highlight this in your recommendation
4. Mention estimated times, safety tips, or gear recommendations
5. Be conversational but concise (under 100 words)
6. NEVER repeat generic messages about being a commute assistant or ask for weather information (we already have it)
7. Do NOT state that you need weather data - you already have it or are using defaults

If asked about walking/biking distance, estimate time based on:
- Walking: ~15-20 minutes per km (slower in bad weather)
- Biking: ~5-7 minutes per km (slower in bad weather)

Example: If someone asks about a 5km walk and it's sunny now but will rain in 2 hours, mention both conditions and suggest timing their commute accordingly.
`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptContent }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract the generated text from the response
    let responseText = '';
    if (result && result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      responseText = result.candidates[0].content.parts[0].text || '';
      
      // If we're using default weather and the response asks for weather info, filter it out
      if (needsDefaultWeather && 
          (responseText.includes("need current weather") || 
           responseText.includes("need weather") ||
           responseText.includes("current weather information") ||
           responseText.includes("temperature information"))) {
        responseText = `Based on the ${currentWeather} conditions with a temperature of ${Math.round(currentTemp)}°C, ${getDefaultResponse(message, travelMode)}`;
      }
    } else {
      responseText = getDefaultResponse(message, travelMode);
    }

    return responseText;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return getDefaultResponse(message, travelMode);
  }
};

// Default responses when API fails
const getDefaultResponse = (message: string, travelMode: string): string => {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('how long') || messageLower.includes('time')) {
    if (travelMode === 'car') {
      return "Based on current weather conditions, your commute by car should take about the usual time. No significant weather-related delays expected.";
    } else if (travelMode === 'walk') {
      return "Your walking commute should be comfortable in the current weather. Allow your usual time plus a few extra minutes.";
    } else if (travelMode === 'bike') {
      return "Biking in these conditions should be fine. Your usual commute time should apply.";
    } else {
      return "Public transportation should be running on schedule in these weather conditions.";
    }
  } else if (messageLower.includes('route') || messageLower.includes('way')) {
    return "Your regular route seems to be the best option given the current weather conditions. No weather-related detours needed.";
  } else if (messageLower.includes('leave') || messageLower.includes('when should')) {
    return "With the current weather, leaving at your usual time should be fine. No need to adjust your schedule for weather-related delays.";
  } else if (messageLower.includes('rain') || messageLower.includes('wet')) {
    return "Current forecast doesn't indicate significant rain that would affect your commute. Keep an umbrella handy just in case.";
  } else if (messageLower.includes('walk') || messageLower.includes('walking')) {
    return "Walking in these weather conditions should be comfortable. Wear appropriate shoes and clothing for the temperature.";
  } else if (messageLower.includes('public') || messageLower.includes('bus') || messageLower.includes('train')) {
    return "Public transportation should be operating normally in these weather conditions. Check the transit app for any non-weather related delays.";
  } else {
    return "Based on the current weather conditions, your commute should be normal. I don't see any weather-related issues that would affect your travel.";
  }
};

// Helper function to determine the weather icon for avatar
const getWeatherIconForAvatar = (condition?: string): string => {
  if (!condition) return "weather-partly-cloudy";
  
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('clear')) {
    return "weather-sunny";
  } else if (conditionLower.includes('cloud')) {
    return "weather-cloudy";
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return "weather-rainy";
  } else if (conditionLower.includes('thunder')) {
    return "weather-lightning";
  } else if (conditionLower.includes('snow')) {
    return "weather-snowy";
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
    return "weather-fog";
  } else {
    return "weather-partly-cloudy";
  }
};

export default function AICommuteScreen({ navigation }: any) {
  // Get the selected city from the WeatherContext
  const { selectedCity } = useWeatherContext();
  
  // Pass the selectedCity to the useWeather hook
  const { weatherData, hourlyForecast } = useWeather(selectedCity);
  
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hi there! I'm your AI commute assistant. How can I help with your weather-dependent travel plans today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTravelMode, setCurrentTravelMode] = useState('car');
  const scrollViewRef = useRef<ScrollView>(null);

  // Log weather data for debugging
  useEffect(() => {
    if (weatherData) {
      console.log("Weather data loaded in AICommuteScreen:", 
        weatherData.weather?.[0]?.main,
        weatherData.main?.temp);
    }
  }, [weatherData]);

  // Load conversation history from AsyncStorage (simplified for this example)
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, []);

  // Add this to your component
  useEffect(() => {
    // This will run whenever selectedCity or weatherData changes
    console.log("Weather data or selected city changed:", selectedCity);
    console.log("Current weather data in state:", 
      weatherData?.weather?.[0]?.main,
      weatherData?.main?.temp);
      
    // If weather data changes, update our initial greeting message
    if (weatherData) {
      const currentWeather = weatherData?.weather?.[0]?.main || "unknown";
      const currentTemp = weatherData?.main?.temp !== undefined ? Math.round(weatherData.main.temp) : "--";
      
      setMessages(prev => {
        // Only update the first message
        if (prev.length > 0 && !prev[0].isUser) {
          const updatedFirstMessage = {
            ...prev[0],
            text: `Hi there! I'm your AI commute assistant. The current weather is ${currentWeather} at ${currentTemp}°C. How can I help with your travel plans today?`
          };
          return [updatedFirstMessage, ...prev.slice(1)];
        }
        return prev;
      });
    }
  }, [selectedCity, weatherData]);

  // Handle predefined questions selection
  const handlePredefinedQuestion = (question: string) => {
    // Don't add duplicate messages in sequence
    if (messages.length > 0 && messages[messages.length - 1].text === question && messages[messages.length - 1].isUser) {
      return;
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    
    // Begin AI response
    setIsLoading(true);
    
    // Get weather from the weather context
    const currentWeather = weatherData?.weather?.[0]?.main;
    const currentTemp = weatherData?.main?.temp;
    
    // Debug log to see what weather data we're passing
    console.log("Passing to AI - Weather:", currentWeather);
    console.log("Passing to AI - Temp:", currentTemp);
    console.log("Passing to AI - Complete weather data:", weatherData);
    
    // Force the use of actual weather data even if it's "undefined" by avoiding the default check
    getAIResponse(
      question, 
      currentWeather || "", // Pass empty string instead of undefined to prevent default
      currentTemp, 
      currentTravelMode,
      weatherData,
      hourlyForecast
    ).then((response) => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Handle sending user message
  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    Keyboard.dismiss();
    
    // Begin AI response
    setIsLoading(true);
    
    // Get weather from the weather context
    const currentWeather = weatherData?.weather?.[0]?.main;
    const currentTemp = weatherData?.main?.temp;
    
    // Debug log to see what weather data we're passing
    console.log("Passing to AI - Weather:", currentWeather);
    console.log("Passing to AI - Temp:", currentTemp);
    
    // Force the use of actual weather data even if it's "undefined" by avoiding the default check
    getAIResponse(
      userMessage.text, 
      currentWeather || "", // Pass empty string instead of undefined to prevent default
      currentTemp,
      currentTravelMode,
      weatherData,
      hourlyForecast
    ).then((response) => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };
  
  // Change travel mode
  const changeTravelMode = (mode: string) => {
    setCurrentTravelMode(mode);
    
    // Provide a helpful message when travel mode changes
    const modeChangedMessage: Message = {
      id: Date.now().toString(),
      text: `Travel mode updated to ${mode}. My advice will now be tailored for ${mode} transportation.`,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, modeChangedMessage]);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Format message timestamp
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Travel mode selector at the top */}
        <View style={styles.travelModeContainer}>
          <Text style={styles.travelModeTitle}>Travel Mode:</Text>
          <View style={styles.travelModeOptions}>
        <TouchableOpacity 
              style={[
                styles.travelModeOption,
                currentTravelMode === 'car' && styles.activeTravelMode
              ]}
              onPress={() => changeTravelMode('car')}
            >
              <FontAwesome5 
                name="car" 
                size={16} 
                color={currentTravelMode === 'car' ? '#fff' : '#666'} 
              />
              <Text 
                style={[
                  styles.travelModeText, 
                  { color: currentTravelMode === 'car' ? '#fff' : '#666' }
                ]}
              >
                Car
              </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
              style={[
                styles.travelModeOption,
                currentTravelMode === 'walk' && styles.activeTravelMode
              ]}
              onPress={() => changeTravelMode('walk')}
            >
              <FontAwesome5 
                name="walking" 
                size={16} 
                color={currentTravelMode === 'walk' ? '#fff' : '#666'} 
              />
              <Text 
                style={[
                  styles.travelModeText, 
                  { color: currentTravelMode === 'walk' ? '#fff' : '#666' }
                ]}
              >
                Walk
              </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
              style={[
                styles.travelModeOption,
                currentTravelMode === 'bike' && styles.activeTravelMode
              ]}
              onPress={() => changeTravelMode('bike')}
            >
              <FontAwesome5 
                name="bicycle" 
                size={16} 
                color={currentTravelMode === 'bike' ? '#fff' : '#666'} 
              />
              <Text 
                style={[
                  styles.travelModeText, 
                  { color: currentTravelMode === 'bike' ? '#fff' : '#666' }
                ]}
              >
                Bike
              </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
              style={[
                styles.travelModeOption,
                currentTravelMode === 'transit' && styles.activeTravelMode
              ]}
              onPress={() => changeTravelMode('transit')}
            >
              <FontAwesome5 
                name="bus" 
                size={16} 
                color={currentTravelMode === 'transit' ? '#fff' : '#666'} 
              />
              <Text 
                style={[
                  styles.travelModeText, 
                  { color: currentTravelMode === 'transit' ? '#fff' : '#666' }
                ]}
              >
                Transit
              </Text>
        </TouchableOpacity>
      </View>
        </View>

        {/* Weather info indicator */}
        {weatherData && (
          <View style={styles.weatherIndicator}>
            <MaterialCommunityIcons 
              name={getWeatherIconForAvatar(weatherData?.weather?.[0]?.main) as any}
              size={18} 
              color="#4B9FE1" 
            />
            <Text style={styles.weatherInfo}>
              {weatherData?.weather?.[0]?.main || 'Loading weather'}, 
              {weatherData?.main?.temp !== undefined ? Math.round(weatherData.main.temp) : '--'}°C
            </Text>
          </View>
        )}

        {/* Messages area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
          {messages.map((message) => (
          <View 
            key={message.id}
            style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {!message.isUser && (
              <View style={styles.avatarContainer}>
                  <MaterialCommunityIcons 
                    name={getWeatherIconForAvatar(weatherData?.weather?.[0]?.main) as any}
                    size={24}
                    color="#4B9FE1" 
                  />
              </View>
            )}
            <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText, 
                  { color: message.isUser ? '#fff' : '#333' }
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                  { color: message.isUser ? 'rgba(255,255,255,0.7)' : '#888' }
              ]}>
                {formatMessageTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}
          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.avatarContainer}>
                <MaterialCommunityIcons 
                  name={getWeatherIconForAvatar(weatherData?.weather?.[0]?.main) as any}
                  size={24}
                  color="#4B9FE1" 
                />
              </View>
              <View style={[styles.messageBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#4B9FE1" />
            </View>
          </View>
        )}
      </ScrollView>

        {/* Pre-defined questions */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.predefinedContainer}
          contentContainerStyle={styles.predefinedContent}
        >
          {PREDEFINED_QUESTIONS.map((question) => (
            <TouchableOpacity
              key={question.id}
              style={styles.predefinedQuestion}
              onPress={() => handlePredefinedQuestion(question.text)}
            >
              <Ionicons name={question.icon} size={16} color="#4B9FE1" style={styles.predefinedIcon} />
              <Text style={styles.predefinedText}>{question.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
            placeholder="Ask me about your commute..."
          placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity 
            style={[
              styles.sendButton,
              { opacity: input.trim().length > 0 ? 1 : 0.5 }
            ]} 
          onPress={handleSendMessage}
            disabled={input.trim().length === 0}
          >
            <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  travelModeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  travelModeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  travelModeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  travelModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  activeTravelMode: {
    backgroundColor: '#4B9FE1',
  },
  travelModeText: {
    marginLeft: 6,
    fontSize: 14,
  },
  weatherIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(75, 159, 225, 0.1)',
    padding: 6,
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 8,
    marginBottom: 4,
  },
  weatherInfo: {
    fontSize: 14,
    color: '#4B9FE1',
    marginLeft: 6,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingTop: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(75, 159, 225, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#4B9FE1',
  },
  aiBubble: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  predefinedContainer: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  predefinedContent: {
    padding: 10,
    paddingRight: 20,
  },
  predefinedQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
  },
  predefinedIcon: {
    marginRight: 8,
  },
  predefinedText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B9FE1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
}); 