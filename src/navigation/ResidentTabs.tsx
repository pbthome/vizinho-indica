import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { AddRecommendationScreen } from '../screens/AddRecommendationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResidentTabsParamList } from './types';

const Tab = createBottomTabNavigator<ResidentTabsParamList>();

export function ResidentTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 52 + bottomPadding,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          backgroundColor: colors.surface,
          borderTopColor: '#E5ECE8',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#0E2E25',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 10
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '700' }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início', tabBarIcon: ({ color }) => <Home color={color} size={21} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User color={color} size={21} /> }} />
      <Tab.Screen
        name="AddRecommendation"
        component={AddRecommendationScreen}
        options={{
          title: 'Indicar',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
    </Tab.Navigator>
  );
}
