import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, MessageSquareMore, X } from 'lucide-react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { sendFeedback } from '../services/api';
import { FeedbackSubject } from '../types';
import { commonStyles } from './styles';

const feedbackSubjects: FeedbackSubject[] = [
  'Problema no app',
  'Sugestao de melhoria',
  'Dados incorretos',
  'Recomendacao/fornecedor',
  'Duvida',
  'Outro'
];

export function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useApp();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [subject, setSubject] = useState<FeedbackSubject | ''>('');
  const [message, setMessage] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!successVisible) return;
    const timeout = setTimeout(() => setSuccessVisible(false), 2800);
    return () => clearTimeout(timeout);
  }, [successVisible]);

  function resetForm() {
    setSubject('');
    setMessage('');
    setSubjectError('');
    setMessageError('');
    setSubmitError('');
  }

  async function logout() {
    await signOut();
    navigation.getParent()?.replace('Auth', { screen: 'Welcome' });
  }

  async function handleSubmitFeedback() {
    const nextSubjectError = subject ? '' : 'Selecione um assunto.';
    const nextMessageError = message.trim() ? '' : 'Escreva uma mensagem para enviar.';

    setSubjectError(nextSubjectError);
    setMessageError(nextMessageError);
    setSubmitError('');

    if (nextSubjectError || nextMessageError || !user || submitting || !subject) return;

    setSubmitting(true);
    try {
      await sendFeedback(user, { subject, message: message.trim() });
      setFeedbackVisible(false);
      resetForm();
      setSuccessVisible(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Nao foi possivel enviar o feedback agora.');
    } finally {
      setSubmitting(false);
    }
  }

  function openFeedbackModal() {
    setSubmitError('');
    setFeedbackVisible(true);
  }

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.screen}>
        <Text style={commonStyles.title}>Perfil</Text>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) ?? 'U'}</Text>
          </View>

          <View style={styles.heroTextBlock}>
            <Text style={styles.heroName}>{user?.name}</Text>
            <Text style={commonStyles.subtitle}>{user?.condominiumName}</Text>
            <Text style={commonStyles.smallText}>{user?.unit}</Text>
            <Text style={styles.approvedLabel}>Acesso aprovado</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajude a melhorar o app"
          onPress={openFeedbackModal}
          style={({ pressed }) => [styles.feedbackCard, pressed && styles.feedbackCardPressed]}
        >
          <View style={styles.feedbackCardIcon}>
            <MessageSquareMore color={colors.primary} size={24} />
          </View>

          <View style={styles.feedbackCardTextBlock}>
            <Text style={styles.feedbackCardTitle}>Ajude a melhorar o app</Text>
            <Text style={styles.feedbackCardText}>
              Encontrou algum problema ou tem uma sugestao? Seu feedback ajuda a melhorar a experiencia do condominio.
            </Text>
          </View>

          <View style={styles.feedbackCardFooter}>
            <View style={styles.feedbackCardCta}>
              <Text style={styles.feedbackCardCtaText}>Enviar feedback</Text>
            </View>
          </View>
        </Pressable>

        {successVisible ? (
          <View style={styles.successToast}>
            <Check color={colors.success} size={16} />
            <Text style={styles.successToastText}>Feedback enviado com sucesso</Text>
          </View>
        ) : null}

        <View style={styles.logoutWrap}>
          <AppButton title="Sair" variant="danger" onPress={logout} />
        </View>
      </View>

      <FeedbackModal
        visible={feedbackVisible}
        subject={subject}
        message={message}
        subjectError={subjectError}
        messageError={messageError}
        submitError={submitError}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setFeedbackVisible(false);
          resetForm();
        }}
        onSelectSubject={(value) => {
          setSubject(value);
          if (subjectError) setSubjectError('');
        }}
        onChangeMessage={(value) => {
          setMessage(value);
          if (messageError) setMessageError('');
        }}
        onSubmit={handleSubmitFeedback}
      />
    </ScreenContainer>
  );
}

function FeedbackModal({
  visible,
  subject,
  message,
  subjectError,
  messageError,
  submitError,
  loading,
  onClose,
  onSelectSubject,
  onChangeMessage,
  onSubmit
}: {
  visible: boolean;
  subject: FeedbackSubject | '';
  message: string;
  subjectError: string;
  messageError: string;
  submitError: string;
  loading: boolean;
  onClose: () => void;
  onSelectSubject: (value: FeedbackSubject) => void;
  onChangeMessage: (value: string) => void;
  onSubmit: () => void;
}) {
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enviar feedback</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" disabled={loading} onPress={onClose} style={styles.closeButton}>
              <X color={colors.secondaryText} size={18} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Assunto</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSubjectPickerOpen((current) => !current)}
              style={({ pressed }) => [
                styles.selectField,
                subjectError ? styles.messageInputError : null,
                pressed && styles.subjectChipPressed
              ]}
            >
              <Text style={[styles.selectFieldText, subject ? styles.selectFieldTextSelected : null]}>
                {subject || 'Selecione um assunto'}
              </Text>
              <ChevronDown color={colors.secondaryText} size={18} />
            </Pressable>
            {subjectPickerOpen ? (
              <View style={styles.selectMenu}>
                {feedbackSubjects.map((option) => {
                  const selected = subject === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => {
                        onSelectSubject(option);
                        setSubjectPickerOpen(false);
                      }}
                      style={({ pressed }) => [styles.selectOption, selected && styles.selectOptionSelected, pressed && styles.subjectChipPressed]}
                    >
                      <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {subjectError ? <Text style={styles.errorText}>{subjectError}</Text> : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Mensagem</Text>
            <TextInput
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Descreva seu feedback"
              placeholderTextColor={colors.secondaryText}
              style={[styles.messageInput, messageError ? styles.messageInputError : null]}
              value={message}
              onChangeText={onChangeMessage}
              editable={!loading}
            />
            {messageError ? <Text style={styles.errorText}>{messageError}</Text> : null}
          </View>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <AppButton title="Enviar feedback" onPress={onSubmit} loading={loading} disabled={loading} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1EAE5',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  heroTextBlock: { gap: spacing.xs },
  heroName: {
    color: colors.text,
    fontSize: typography.h1,
    lineHeight: 30,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  approvedLabel: {
    color: colors.success,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  feedbackCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2
  },
  feedbackCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }]
  },
  feedbackCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedbackCardTextBlock: {
    gap: spacing.xs
  },
  feedbackCardTitle: {
    color: colors.text,
    fontSize: typography.h2,
    lineHeight: 26,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  feedbackCardText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 22,
    fontFamily: typography.fontFamily
  },
  feedbackCardFooter: {
    alignItems: 'flex-start'
  },
  feedbackCardCta: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedbackCardCtaText: {
    color: colors.surface,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE6DA',
    backgroundColor: '#EEF7F3',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  successToastText: {
    flex: 1,
    color: '#2B6B54',
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  logoutWrap: {
    marginTop: 'auto'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  modalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.h2,
    lineHeight: 26,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldBlock: { gap: spacing.sm },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  selectField: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  selectFieldText: {
    flex: 1,
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  selectFieldTextSelected: {
    color: colors.text
  },
  selectMenu: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  selectOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  selectOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen
  },
  subjectChipPressed: { opacity: 0.82 },
  selectOptionText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  selectOptionTextSelected: {
    color: colors.primary,
    fontWeight: '800'
  },
  messageInput: {
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 22,
    fontFamily: typography.fontFamily
  },
  messageInputError: {
    borderColor: colors.error
  },
  errorText: {
    color: colors.error,
    fontSize: typography.tiny,
    fontFamily: typography.fontFamily
  },
  submitError: {
    color: colors.error,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  }
});
