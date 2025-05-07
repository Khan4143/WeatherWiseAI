import SettingsScreen from '../screens/SettingsScreen';

{
  Settings: {
    screen: SettingsScreen,
    navigationOptions: {
      tabBarIcon: ({ focused, color }) => (
        <Ionicons 
          name={focused ? 'settings' : 'settings-outline'} 
          size={24} 
          color={color} 
        />
      ),
    },
  },
} 