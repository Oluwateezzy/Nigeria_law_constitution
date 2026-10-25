export const motion = {
  section: 220,
  sheet: 200,
  reduced: 0,
} as const;

export function motionDuration(
  kind: 'section' | 'sheet',
  reduceMotion: boolean,
): number {
  if (reduceMotion) {
    return motion.reduced;
  }
  return motion[kind];
}
