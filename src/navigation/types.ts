import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: { mode?: 'login' } | undefined;
  ResetPassword: { email?: string; mode?: 'code' | 'link' | 'request'; notice?: string; autoSend?: boolean } | undefined;
  Onboarding: undefined;
  SignUp: undefined;
  WaitingApproval: undefined;
  AccessStatus: undefined;
};

export type ResidentTabsParamList = {
  Home: { focusRecommendationId?: string } | undefined;
  Providers: undefined;
  Dashboard: undefined;
  Management: undefined;
  Profile: undefined;
  AddRecommendation: { providerId?: string } | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Resident: NavigatorScreenParams<ResidentTabsParamList> | undefined;
  RecommendationDetail: { id: string; focusReviewId?: string };
  Feedbacks: undefined;
  AccessRequests: undefined;
  AccessRequestDetail: { id: string };
  ReportedRecommendations: undefined;
  ServiceSuggestions: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
