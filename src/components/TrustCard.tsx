import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = { count: number };

export function TrustCard({ count }: Props) {
  return (
    <View style={styles.card}>
      <ShieldCheck color={colors.primary} size={24} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Moradores que já contrataram</Text>
        <Text style={styles.text}>{count} vizinhos confirmaram uso real antes de recomendar.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '800', fontFamily: typography.fontFamily },
  text: { color: colors.secondaryText, fontSize: typography.small, marginTop: spacing.xs, fontFamily: typography.fontFamily }
});
