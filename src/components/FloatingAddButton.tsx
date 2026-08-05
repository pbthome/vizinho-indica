import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = {
  insets: EdgeInsets;
  onPress: () => void;
};

export function FloatingAddButton({ insets, onPress }: Props) {
  return (
    <Pressable accessibilityLabel="Indicar serviço" accessibilityRole="button" onPress={onPress} style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 16 }]}>
      <Plus color={colors.surface} size={25} strokeWidth={2.8} />
      <Text style={styles.fabText}>Indicar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    height: 52,
    minWidth: 104,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6
  },
  fabText: {
    color: colors.surface,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  }
});
