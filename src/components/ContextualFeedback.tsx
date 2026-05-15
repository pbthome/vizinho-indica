import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export type FeedbackAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FeedbackPlacement = 'top' | 'bottom';

export type ContextualFeedbackState = {
  id: number;
  message: string;
  anchor: FeedbackAnchor;
  placement?: FeedbackPlacement;
};

type Props = {
  feedback: ContextualFeedbackState | null;
  bottomInset?: number;
};

const TOOLTIP_WIDTH = 218;
const TOOLTIP_MIN_HEIGHT = 34;
const TOOLTIP_ESTIMATED_HEIGHT = 44;
const SCREEN_MARGIN = spacing.md;
const VERTICAL_GAP = 6;
const CARET_SIZE = 12;

export function ContextualFeedback({ feedback, bottomInset = 0 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const translateY = useRef(new Animated.Value(4)).current;
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!feedback) return;
    opacity.setValue(0);
    scale.setValue(0.96);
    translateY.setValue(feedback.placement === 'bottom' ? -3 : 4);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 140, useNativeDriver: true })
      ]),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.98, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: feedback.placement === 'bottom' ? -2 : 3, duration: 260, useNativeDriver: true })
      ])
    ]).start();
  }, [feedback, opacity, scale, translateY]);

  if (!feedback) return null;

  const placement = resolvePlacement(feedback, height, bottomInset);
  const left = clamp(feedback.anchor.x + feedback.anchor.width / 2 - TOOLTIP_WIDTH / 2, SCREEN_MARGIN, width - TOOLTIP_WIDTH - SCREEN_MARGIN);
  const top =
    placement === 'top'
      ? Math.max(SCREEN_MARGIN, feedback.anchor.y - TOOLTIP_ESTIMATED_HEIGHT - VERTICAL_GAP)
      : Math.min(height - bottomInset - TOOLTIP_ESTIMATED_HEIGHT - SCREEN_MARGIN, feedback.anchor.y + feedback.anchor.height + VERTICAL_GAP);
  const caretLeft = clamp(feedback.anchor.x + feedback.anchor.width / 2 - left - CARET_SIZE / 2, 18, TOOLTIP_WIDTH - 30);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.tooltip,
          {
            left,
            top,
            opacity,
            transform: [{ translateY }, { scale }]
          }
        ]}
      >
        {placement === 'bottom' ? <View style={[styles.caret, styles.caretTop, { left: caretLeft }]} /> : null}
        <Text numberOfLines={2} style={styles.text}>
          {feedback.message}
        </Text>
        {placement === 'top' ? <View style={[styles.caret, styles.caretBottom, { left: caretLeft }]} /> : null}
      </Animated.View>
    </View>
  );
}

function resolvePlacement(feedback: ContextualFeedbackState, height: number, bottomInset: number): FeedbackPlacement {
  if (feedback.placement) return feedback.placement;
  const spaceAbove = feedback.anchor.y;
  const spaceBelow = height - bottomInset - (feedback.anchor.y + feedback.anchor.height);
  return spaceAbove >= TOOLTIP_MIN_HEIGHT + VERTICAL_GAP || spaceAbove > spaceBelow ? 'top' : 'bottom';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    minHeight: TOOLTIP_MIN_HEIGHT,
    borderRadius: 999,
    backgroundColor: '#F7FCF9',
    borderWidth: 1,
    borderColor: '#CFE4DA',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4
  },
  text: {
    color: colors.darkGreen,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: typography.fontFamily
  },
  caret: {
    position: 'absolute',
    width: CARET_SIZE,
    height: CARET_SIZE,
    backgroundColor: '#F7FCF9',
    borderColor: '#CFE4DA',
    transform: [{ rotate: '45deg' }]
  },
  caretTop: {
    top: -6,
    borderLeftWidth: 1,
    borderTopWidth: 1
  },
  caretBottom: {
    bottom: -6,
    borderRightWidth: 1,
    borderBottomWidth: 1
  }
});
