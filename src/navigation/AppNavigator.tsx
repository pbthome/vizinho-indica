import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { AccessRequestDetailScreen } from '../screens/AccessRequestDetailScreen';
import { AccessRequestsScreen } from '../screens/AccessRequestsScreen';
import { FeedbacksScreen } from '../screens/FeedbacksScreen';
import { RecommendationDetailScreen } from '../screens/RecommendationDetailScreen';
import { ReportedRecommendationsScreen } from '../screens/ReportedRecommendationsScreen';
import { AuthStack } from './AuthStack';
import { ResidentTabs } from './ResidentTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Resident" component={ResidentTabs} />
      <Stack.Screen name="RecommendationDetail" component={RecommendationDetailScreen} />
      <Stack.Screen name="Feedbacks" component={FeedbacksScreen} />
      <Stack.Screen name="AccessRequests" component={AccessRequestsScreen} />
      <Stack.Screen name="AccessRequestDetail" component={AccessRequestDetailScreen} />
      <Stack.Screen name="ReportedRecommendations" component={ReportedRecommendationsScreen} />
    </Stack.Navigator>
  );
}
