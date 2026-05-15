import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const commonStyles = StyleSheet.create({
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: { color: colors.surface, fontSize: 28, fontWeight: '900', fontFamily: typography.fontFamily },
  title: { color: colors.text, fontSize: typography.h1, lineHeight: 30, fontWeight: '900', fontFamily: typography.fontFamily },
  subtitle: { color: colors.secondaryText, fontSize: typography.body, lineHeight: 24, fontFamily: typography.fontFamily },
  sectionTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900', marginTop: spacing.lg, fontFamily: typography.fontFamily },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: spacing.sm
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gap: { gap: spacing.md },
  smallText: { color: colors.secondaryText, fontSize: typography.small, lineHeight: 20, fontFamily: typography.fontFamily }
});
