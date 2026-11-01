import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import type { ColorValue } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface TabBarIconProps {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  color: ColorValue | string;
}

export function TabBarIcon({
  focused,
  name,
  outlineName,
  color,
}: TabBarIconProps) {
  const { colors, reduceMotion } = useTheme();
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1.0)).current;
  const dotOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(focused ? 1.1 : 1.0);
      dotOpacity.setValue(focused ? 1 : 0);
      return;
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: focused ? 1.1 : 1.0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dotOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, reduceMotion, scaleAnim, dotOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={focused ? name : outlineName}
          size={22}
          color={(color as string) ?? colors.inkMuted}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.primary,
            opacity: dotOpacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
