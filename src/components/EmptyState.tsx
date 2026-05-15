import { StyleSheet, Text, View } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = {
  title: string;
  children?: ReactNode;
};

export function EmptyState({ title, children }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md
  },
  title: { color: colors.secondaryText, fontSize: typography.body, textAlign: 'center', fontFamily: typography.fontFamily }
});
