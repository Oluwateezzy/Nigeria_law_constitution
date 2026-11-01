import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { OnboardingSlideData } from './types';

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  index: number;
  width: number;
  scrollX: Animated.Value;
}

export function OnboardingSlide({ slide, index, width, scrollX }: OnboardingSlideProps) {
  const { colors, reduceMotion } = useTheme();

  // Parallax: Illustration moves at 0.7x text speed
  // [ (index - 1) * width, index * width, (index + 1) * width ]
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageTranslateX = reduceMotion
    ? 0
    : scrollX.interpolate({
        inputRange,
        outputRange: [-width * 0.3, 0, width * 0.3],
        extrapolate: 'clamp',
      });

  const imageScale = reduceMotion
    ? 1
    : scrollX.interpolate({
        inputRange,
        outputRange: [0.88, 1, 0.88],
        extrapolate: 'clamp',
      });

  const contentOpacity = reduceMotion
    ? 1
    : scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });

  const contentTranslateX = reduceMotion
    ? 0
    : scrollX.interpolate({
        inputRange,
        outputRange: [width * 0.2, 0, -width * 0.2],
        extrapolate: 'clamp',
      });

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* Illustration Area with Parallax */}
      <View style={styles.illustrationWrapper}>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ translateX: imageTranslateX }, { scale: imageScale }],
            },
          ]}
        >
          <Image
            source={slide.image}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={slide.title}
          />
        </Animated.View>
      </View>

      {/* Text Content Area */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: contentOpacity,
            transform: [{ translateX: contentTranslateX }],
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{slide.badge}</Text>
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  illustrationWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
    maxHeight: 340,
    aspectRatio: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
    borderRadius: radius.xl,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: space.sm,
  },
  badgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.interBold,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: space.sm,
  },
  subtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },
});
