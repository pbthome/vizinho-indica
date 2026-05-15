import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'Inter, SF Pro Text',
    android: 'Inter, Roboto',
    default: 'System'
  }),
  title: 28,
  h1: 24,
  h2: 20,
  body: 16,
  small: 14,
  tiny: 12
} as const;
