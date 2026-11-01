import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { motion } from '@/theme/motion';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export interface PressableCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  elevationLevel?: 1 | 2 | 3;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  testID?: string;
}

export function PressableCard({
  children,
  onPress,
  style,
  contentStyle,
  elevationLevel = 1,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
}: PressableCardProps) {
  const { elevation, reduceMotion, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: reduceMotion ? 1 : 0.98,
        duration: motion.card, // 150ms
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: motion.card, // 150ms
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: motion.card, // 150ms
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        elevation[elevationLevel],
        {
          backgroundColor: colors.bgRaised,
          borderColor: colors.line,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[styles.innerPressable, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerPressable: {
    width: '100%',
  },
});
