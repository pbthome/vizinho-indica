import { forwardRef } from 'react';
import { Keyboard, Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export const AppInput = forwardRef<TextInput, Props>(function AppInput(
  { label, error, style, onSubmitEditing, blurOnSubmit, ...props },
  ref
) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.secondaryText}
        style={[styles.input, error && styles.inputError, style]}
        blurOnSubmit={blurOnSubmit ?? true}
        onSubmitEditing={(event) => {
          onSubmitEditing?.(event);
          Keyboard.dismiss();
        }}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  label: { color: colors.text, fontSize: typography.small, lineHeight: 18, fontWeight: '700', fontFamily: typography.fontFamily },
  input: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: typography.tiny, fontFamily: typography.fontFamily }
});
