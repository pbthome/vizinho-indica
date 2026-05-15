import { MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { Recommendation } from '../types';
import { AppButton } from './AppButton';
import { RatingStars } from './RatingStars';

type Props = {
  item: Recommendation;
  onDetails: () => void;
  onWhatsApp: () => void;
};

export function RecommendationCard({ item, onDetails, onWhatsApp }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{item.supplierName}</Text>
          <Text style={styles.category}>{item.customServiceDescription || item.serviceSpecialtyName || item.categoryName}</Text>
        </View>
        <RatingStars rating={item.averageRating} />
      </View>
      <Text style={styles.comment}>{item.shortComment}</Text>
      <Text style={styles.trust}>{item.recommendedByCount} moradores recomendam</Text>
      <View style={styles.actions}>
        <AppButton title="Ver detalhes" variant="secondary" onPress={onDetails} style={styles.detailButton} />
        <Pressable accessibilityRole="button" onPress={onWhatsApp} style={styles.iconButton}>
          <MessageCircle color={colors.surface} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: spacing.md
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  titleWrap: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '800', fontFamily: typography.fontFamily },
  category: { color: colors.primary, fontSize: typography.small, fontWeight: '700', fontFamily: typography.fontFamily },
  comment: { color: colors.text, fontSize: typography.small, lineHeight: 20, fontFamily: typography.fontFamily },
  trust: { color: colors.secondaryText, fontSize: typography.tiny, fontFamily: typography.fontFamily },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailButton: { flex: 1 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.whatsApp,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
