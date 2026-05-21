import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

type Props = PropsWithChildren<{
  scroll?: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  children,
  scroll = true,
  scrollRef,
  keyboardDismissMode,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  contentContainerStyle
}: Props) {
  const content = [styles.content, contentContainerStyle];

  if (!scroll) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <KeyboardAvoidingView
          enabled={keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={styles.staticContent}
        >
          <View style={styles.staticContent}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <KeyboardAvoidingView
        enabled={keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.staticContent}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={keyboardDismissMode}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  staticContent: { flex: 1 }
});
