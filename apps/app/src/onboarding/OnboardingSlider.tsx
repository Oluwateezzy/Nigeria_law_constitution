import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AnimatedDots } from './AnimatedDots';
import { OnboardingSlide } from './OnboardingSlide';
import { ONBOARDING_SLIDES } from './types';
import { setCompletedOnboarding } from './storage';

interface OnboardingSliderProps {
  onComplete: () => void;
}

export function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, reduceMotion } = useTheme();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;

  // Window resize listener for responsive dimensions (web / tablet rotate)
  useEffect(() => {
    const sub = Dimensions.addEventListener(
      'change',
      ({ window }: { window: any }) => {
        setDimensions(window);
      },
    );
    return () => sub?.remove();
  }, []);

  // Fade in skip button
  useEffect(() => {
    if (reduceMotion) {
      skipOpacity.setValue(1);
      return;
    }
    Animated.timing(skipOpacity, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, skipOpacity]);

  const handleFinish = useCallback(async () => {
    await setCompletedOnboarding(true);
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: !reduceMotion,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  }, [currentIndex, handleFinish, reduceMotion]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / dimensions.width);
      if (index >= 0 && index < ONBOARDING_SLIDES.length) {
        setCurrentIndex(index);
      }
    },
    [dimensions.width],
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  // Subtle background color shift based on scrollX
  const backgroundColor = scrollX.interpolate({
    inputRange: ONBOARDING_SLIDES.map((_, i) => i * dimensions.width),
    outputRange: [
      colors.bg,
      scheme === 'dark' ? '#091A14' : '#F2FAF6',
      scheme === 'dark' ? '#071815' : '#F0F9F8',
      scheme === 'dark' ? '#1C1507' : '#FDFBF4',
      colors.bg,
    ],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.root, { backgroundColor }]}>
      {/* Top Header with Brand Badge and Skip Button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingHorizontal: space.lg,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.stepIndicator, { color: colors.inkMuted }]}>
            {currentIndex + 1} of {ONBOARDING_SLIDES.length}
          </Text>
        </View>

        <Animated.View style={{ opacity: skipOpacity }}>
          <Pressable
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={12}
            style={({ pressed }) => [
              styles.skipButton,
              {
                backgroundColor: pressed ? colors.line : 'transparent',
              },
            ]}
          >
            <Text style={[styles.skipText, { color: colors.inkMuted }]}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Swipeable Slides List */}
      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            slide={item}
            index={index}
            width={dimensions.width}
            scrollX={scrollX}
          />
        )}
        style={styles.list}
      />

      {/* Footer with Dots & Next / Get Started Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 24),
            paddingHorizontal: space.lg,
          },
        ]}
      >
        <AnimatedDots
          total={ONBOARDING_SLIDES.length}
          activeIndex={currentIndex}
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={isLastSlide ? 'Get Started' : 'Next slide'}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={styles.ctaText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    zIndex: 10,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  stepIndicator: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  skipText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.md,
  },
  actionRow: {
    width: '100%',
    maxWidth: 360,
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#006B3F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 107, 63, 0.3)',
      },
    }),
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
