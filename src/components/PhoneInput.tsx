import { ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import {
  defaultPhoneCountry,
  findPhoneCountryByDialCode,
  formatInternationalPhone,
  formatNationalPhone,
  getNationalPhoneDigits,
  PhoneCountry,
  phoneCountries
} from '../utils/phone';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  helperText?: string;
};

export function PhoneInput({ label, value, onChangeText, error, helperText }: Props) {
  const initialCountry = useMemo(() => findPhoneCountryByDialCode(value) ?? defaultPhoneCountry, [value]);
  const [country, setCountry] = useState<PhoneCountry>(initialCountry);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nationalDigits = getNationalPhoneDigits(value, country);
  const missingDigits = Math.max(country.minDigits - nationalDigits.length, 0);
  const showLengthHint = nationalDigits.length > 0 && missingDigits > 0 && !error;
  const visibleCountries = useMemo(() => {
    const normalized = normalize(query);
    if (!normalized) return phoneCountries;
    return phoneCountries.filter((item) =>
      normalize(`${item.name} ${item.dialCode} ${item.id}`).includes(normalized)
    );
  }, [query]);

  useEffect(() => {
    const nextCountry = findPhoneCountryByDialCode(value);
    if (nextCountry && nextCountry.dialCode !== country.dialCode) {
      setCountry(nextCountry);
    }
  }, [country.dialCode, value]);

  function changeCountry(nextCountry: PhoneCountry) {
    setCountry(nextCountry);
    setOpen(false);
    setQuery('');
    onChangeText(formatInternationalPhone(nextCountry, nationalDigits));
  }

  function changePhone(text: string) {
    const digits = getNationalPhoneDigits(text, country);
    onChangeText(formatInternationalPhone(country, digits));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <Pressable style={styles.countryButton} onPress={() => setOpen(true)} accessibilityRole="button">
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dialCode}>{country.dialCode}</Text>
          <ChevronDown color={colors.secondaryText} size={16} />
        </Pressable>
        <TextInput
          value={formatNationalPhone(country, nationalDigits)}
          onChangeText={changePhone}
          keyboardType="phone-pad"
          placeholder={country.example}
          placeholderTextColor={colors.secondaryText}
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showLengthHint ? <Text style={styles.helper}>Faltam {missingDigits} digitos para completar.</Text> : null}
      {!error && !showLengthHint && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={() => setOpen(false)} />
          <View style={styles.countrySheet}>
            <Text style={styles.sheetTitle}>Selecionar pais</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar pais ou DDI"
              placeholderTextColor={colors.secondaryText}
              style={styles.searchInput}
              autoCapitalize="none"
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {visibleCountries.map((item) => (
                <Pressable key={item.id} style={[styles.countryOption, item.id === country.id && styles.countryOptionSelected]} onPress={() => changeCountry(item)}>
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{item.dialCode} - {item.minDigits === item.maxDigits ? `${item.maxDigits} digitos` : `${item.minDigits}-${item.maxDigits} digitos`}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  label: { color: colors.text, fontSize: typography.small, lineHeight: 18, fontWeight: '700', fontFamily: typography.fontFamily },
  inputRow: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  inputError: { borderColor: colors.error },
  countryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: '#DDE9E4'
  },
  flag: { fontSize: 18, lineHeight: 22 },
  dialCode: { color: colors.text, fontSize: typography.small, fontWeight: '800', fontFamily: typography.fontFamily },
  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  error: { color: colors.error, fontSize: typography.tiny, fontFamily: typography.fontFamily },
  helper: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 16, fontFamily: typography.fontFamily },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 27, 0.28)'
  },
  countrySheet: {
    maxHeight: '72%',
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12
  },
  sheetTitle: { color: colors.text, fontSize: typography.body, lineHeight: 22, fontWeight: '900', fontFamily: typography.fontFamily },
  searchInput: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.small,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.sm
  },
  countryOption: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  countryOptionSelected: { backgroundColor: colors.lightGreen },
  optionFlag: { fontSize: 22, lineHeight: 26 },
  optionTextWrap: { flex: 1, gap: 2 },
  optionName: { color: colors.text, fontSize: typography.small, fontWeight: '800', fontFamily: typography.fontFamily },
  optionMeta: { color: colors.secondaryText, fontSize: typography.tiny, fontFamily: typography.fontFamily }
});
