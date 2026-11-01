import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface ConfettiBurstProps {
  active?: boolean;
  count?: number;
  onComplete?: () => void;
  style?: ViewStyle;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

const CONFETTI_COLORS = ['#006B3F', '#D4A017', '#3FB68B', '#F5C842', '#CF222E', '#FFFFFF'];

export function ConfettiBurst({
  active = true,
  count = 24,
  onComplete,
  style,
}: ConfettiBurstProps) {
  const { reduceMotion } = useTheme();

  const particles = useRef<Particle[]>(
    Array.from({ length: count }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.5),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + (i % 5) * 2,
    })),
  ).current;

  useEffect(() => {
    if (!active) return;

    if (reduceMotion) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const animations = particles.map((p, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 60 + Math.random() * 100;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY + 40, // gravity drop
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(p.scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: Math.random() > 0.5 ? 1 : -1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(15, animations).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, [active, count, onComplete, particles, reduceMotion]);

  if (!active || reduceMotion) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {particles.map((p, i) => {
        const spin = p.rotate.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-180deg', '0deg', '180deg'],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size * (i % 2 === 0 ? 1 : 1.6),
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});
