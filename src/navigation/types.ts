import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: { mode?: 'login' } | undefined;
  Onboarding: undefined;
  SignUp: undefined;
  WaitingApproval: undefined;
  AccessStatus: undefined;
};

export type ResidentTabsParamList = {
  Home: { focusRecommendationId?: string } | undefined;
  Profile: undefined;
  AddRecommendation: { providerId?: string } | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Resident: NavigatorScreenParams<ResidentTabsParamList> | undefined;
  RecommendationDetail: { id: string; focusReviewId?: string };
  AdminDashboard: undefined;
  AccessRequests: undefined;
  AccessRequestDetail: { id: string };
  ReportedRecommendations: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
