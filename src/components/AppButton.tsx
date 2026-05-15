import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={isGhost ? colors.primary : colors.surface} /> : <Text style={[styles.text, isGhost && styles.ghostText, variant === 'secondary' && styles.secondaryText]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.lightGreen, borderWidth: 1, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  whatsapp: { backgroundColor: colors.whatsApp },
  danger: { backgroundColor: colors.error },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  text: { color: colors.surface, fontSize: typography.body, fontWeight: '700', fontFamily: typography.fontFamily },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.primary }
});
