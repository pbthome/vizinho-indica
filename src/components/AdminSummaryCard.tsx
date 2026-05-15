import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { AppButton } from './AppButton';

type Props = {
  title: string;
  value: string;
  buttonTitle: string;
  onPress: () => void;
};

export function AdminSummaryCard({ title, value, buttonTitle, onPress }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <AppButton title={buttonTitle} onPress={onPress} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: spacing.md
  },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '800', fontFamily: typography.fontFamily },
  value: { color: colors.secondaryText, fontSize: typography.small, marginTop: spacing.xs, fontFamily: typography.fontFamily }
});
