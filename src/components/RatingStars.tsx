import { Star } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = { rating: number; count?: number; compact?: boolean };

export function RatingStars({ rating, count, compact }: Props) {
  return (
    <View style={styles.row}>
      <Star size={compact ? 14 : 16} color={colors.star} fill={colors.star} />
      <Text style={[styles.text, compact && styles.compact]}>{rating.toFixed(1)}</Text>
      {count !== undefined ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: { color: colors.text, fontSize: typography.small, fontWeight: '700', fontFamily: typography.fontFamily },
  compact: { fontSize: typography.tiny },
  count: { color: colors.secondaryText, fontSize: typography.tiny, fontFamily: typography.fontFamily }
});
