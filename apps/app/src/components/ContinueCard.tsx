import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { getElevation } from '@/theme/elevation';
import { motion } from '@/theme/motion';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type ContinueCardProps = {
  kicker: string;
  title: string;
  detail: string;
  onPress: () => void;
};

export function ContinueCard({
  kicker,
  title,
  detail,
  onPress,
}: ContinueCardProps) {
  const { scheme, colors, gradient, reduceMotion } = useTheme();
  const enterAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      enterAnim.setValue(1);
      return;
    }

    Animated.timing(enterAnim, {
      toValue: 1,
      duration: motion.screen,
      useNativeDriver: true,
    }).start();
  }, [enterAnim, reduceMotion]);

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: motion.card,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: motion.card,
      useNativeDriver: true,
    }).start();
  };

  const elevationStyle = getElevation(2, scheme);
  const [gradientStart, gradientEnd] = gradient.hero;

  return (
    <Animated.View
      style={[
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            { scale: pressAnim },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${kicker}. ${title}. ${detail}`}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          elevationStyle,
          styles.card,
          {
            backgroundColor: gradientStart,
            borderColor: scheme === 'dark' ? colors.line : 'rgba(0, 107, 63, 0.2)',
          },
        ]}
      >
        {/* Subtle gradient accent stripe */}
        <View
          style={[
            styles.accentStripe,
            { backgroundColor: gradientEnd },
          ]}
        />

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: scheme === 'dark' ? colors.primarySoft : 'rgba(255, 255, 255, 0.25)' },
              ]}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontFamily: fonts.interMedium,
                  fontSize: typeScale.badge.fontSize,
                  lineHeight: typeScale.badge.lineHeight,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {kicker}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={2}
            style={{
              marginTop: space.sm,
              color: '#FFFFFF',
              fontFamily: fonts.interSemi,
              fontSize: typeScale.h2.fontSize,
              lineHeight: typeScale.h2.lineHeight,
              fontWeight: '700',
            }}
          >
            {title}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: space.xs,
              color: colors.accent,
              fontFamily: fonts.interMedium,
              fontSize: typeScale.body.fontSize,
              lineHeight: typeScale.body.lineHeight,
            }}
          >
            {detail} →
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 100,
    marginTop: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '40%',
    opacity: 0.4,
  },
  content: {
    padding: space.md,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
});
