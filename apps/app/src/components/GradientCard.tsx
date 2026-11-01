import { LinearGradient } from 'expo-linear-gradient';
import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface GradientCardProps {
  children: ReactNode;
  colors?: readonly [string, string] | [string, string];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export function GradientCard({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  onPress,
  accessibilityLabel,
  testID,
}: GradientCardProps) {
  const { gradient, elevation, reduceMotion } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const gradientColors = colors ?? gradient.hero;

  const handlePressIn = () => {
    if (reduceMotion || !onPress) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.92,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (reduceMotion || !onPress) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cardContent = (
    <LinearGradient
      colors={[gradientColors[0], gradientColors[1]]}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );

  if (!onPress) {
    return (
      <Animated.View style={[styles.container, elevation[2]]}>
        {cardContent}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        elevation[2],
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {cardContent}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  gradient: {
    padding: space.lg,
    borderRadius: radius.card,
  },
});
