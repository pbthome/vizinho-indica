import { MessageCircle, Search, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

const steps = [
  {
    icon: Search,
    title: 'Busque pelo que precisa',
    text: 'Encontre serviços recomendados dentro do seu próprio condomínio.'
  },
  {
    icon: Users,
    title: 'Veja a confiança local',
    text: 'Relatos vêm de moradores verificados, não de avaliações públicas.'
  },
  {
    icon: MessageCircle,
    title: 'Chame com segurança',
    text: 'Fale direto com profissionais já indicados pela comunidade.'
  }
];

export function OnboardingScreen({ navigation }: any) {
  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Como a comunidade ajuda{'\n'}você a contratar melhor</Text>
          <Text style={styles.subtitle}>Vicini organiza a confiança que já existe entre moradores para reduzir risco na escolha de um profissional.</Text>
        </View>

        <View style={styles.steps}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <View key={step.title} style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Icon color={colors.primary} size={18} strokeWidth={2.35} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepKicker}>0{index + 1}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton title="Começar" onPress={() => navigation.navigate('SignUp')} style={styles.primaryButton} />
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Welcome', { mode: 'login' })} style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
            <Text style={styles.ghostButtonText}>Já tenho conta</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  header: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    maxWidth: 360,
    fontFamily: typography.fontFamily
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 342,
    fontFamily: typography.fontFamily
  },
  steps: {
    gap: 5
  },
  stepItem: {
    minHeight: 78,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5ECE8'
  },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#EEF7F3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepContent: {
    flex: 1,
    gap: 2
  },
  stepKicker: {
    color: '#6BAF99',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  stepText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 19,
    fontFamily: typography.fontFamily
  },
  actions: {
    gap: spacing.sm,
    paddingTop: 2
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: colors.darkGreen
  },
  ghostButton: {
    minHeight: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: '#D6E8E1'
  },
  ghostButtonText: {
    color: colors.darkGreen,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  pressed: {
    opacity: 0.86
  }
});
