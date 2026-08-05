import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

type SkeletonBlockProps = {
  width: number | `${number}%` | '100%';
  height: number;
  radius?: number;
};

export function SkeletonBlock({ width, height, radius = 10 }: SkeletonBlockProps) {
  return <View style={[styles.block, { width, height, borderRadius: radius }]} />;
}

export function SkeletonPill({ width, height = 26 }: { width: number; height?: number }) {
  return <SkeletonBlock width={width} height={height} radius={999} />;
}

export function SkeletonCircle({ size }: { size: number }) {
  return <SkeletonBlock width={size} height={size} radius={size / 2} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.muted
  }
});
