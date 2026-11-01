import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface AnimatedDotsProps {
  total: number;
  activeIndex: number;
}

export function AnimatedDots({ total, activeIndex }: AnimatedDotsProps) {
  const { colors, reduceMotion } = useTheme();

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: activeIndex + 1 }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <Dot
            key={i}
            isActive={isActive}
            primaryColor={colors.primary}
            inactiveColor={colors.line}
            reduceMotion={reduceMotion}
          />
        );
      })}
    </View>
  );
}

function Dot({
  isActive,
  primaryColor,
  inactiveColor,
  reduceMotion,
}: {
  isActive: boolean;
  primaryColor: string;
  inactiveColor: string;
  reduceMotion: boolean;
}) {
  const widthAnim = useRef(new Animated.Value(isActive ? 24 : 8)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

  useEffect(() => {
    if (reduceMotion) {
      widthAnim.setValue(isActive ? 24 : 8);
      opacityAnim.setValue(isActive ? 1 : 0.4);
      return;
    }

    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: isActive ? 24 : 8,
        useNativeDriver: false,
        friction: 7,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.4,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, reduceMotion, widthAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          opacity: opacityAnim,
          backgroundColor: isActive ? primaryColor : inactiveColor,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
