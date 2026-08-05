import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, Home, Search, ShieldAlert, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AddRecommendationScreen } from '../screens/AddRecommendationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ManagementScreen } from '../screens/ManagementScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProvidersScreen } from '../screens/ProvidersScreen';
import { useApp } from '../services/AppContext';
import { isAdmin } from './guards';
import { ResidentTabsParamList } from './types';

const Tab = createBottomTabNavigator<ResidentTabsParamList>();

export function ResidentTabs() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const showAdminDashboard = isAdmin(user);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          flex: 1,
          backgroundColor: colors.background
        },
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Home color={color} size={21} /> }} />
      <Tab.Screen name="Providers" component={ProvidersScreen} options={{ title: 'Prestadores', tabBarIcon: ({ color }) => <Search color={color} size={21} /> }} />
      {showAdminDashboard ? (
        <>
          <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Painel', tabBarIcon: ({ color }) => <BarChart3 color={color} size={21} /> }} />
          <Tab.Screen name="Management" component={ManagementScreen} options={{ title: 'Gestao', tabBarIcon: ({ color }) => <ShieldAlert color={color} size={21} /> }} />
        </>
      ) : null}
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
