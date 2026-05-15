import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.text, fontSize: typography.small, fontWeight: '600', fontFamily: typography.fontFamily },
  selectedText: { color: colors.surface }
});
