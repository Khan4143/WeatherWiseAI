import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to our new home screen
  return <Redirect href="/screens/home" />;
} 