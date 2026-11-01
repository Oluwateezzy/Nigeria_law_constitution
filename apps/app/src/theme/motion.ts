export const motion = {
  screen: 300,
  card: 150,
  sheet: 250,
  onboarding: 400,
  trivia: 300,
  tab: 200,
  shimmer: 1500,
  section: 220, // backward-compatibility
  reduced: 0,
} as const;

export const springConfig = {
  sheet: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  onboarding: {
    damping: 25,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  cardPress: {
    damping: 15,
    mass: 0.8,
    stiffness: 150,
  },
} as const;

export const easings = {
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOut: (t: number) => t * (2 - t),
  linear: (t: number) => t,
  curves: {
    easeInOut: [0.42, 0, 0.58, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
  },
} as const;

export type MotionKind = keyof typeof motion;

export function motionDuration(
  kind: MotionKind,
  reduceMotion: boolean,
): number {
  if (reduceMotion) {
    return motion.reduced;
  }
  return motion[kind];
}
