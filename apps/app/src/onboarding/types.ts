import type { ImageSourcePropType } from 'react-native';

export interface OnboardingSlideData {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image: ImageSourcePropType;
  accentColor: string;
  gradient: [string, string];
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 1,
    badge: 'NIGERIAN LAW & CONSTITUTION',
    title: 'What Does The Law Say',
    subtitle: 'Your guide to Nigerian law — simple, clear, and always with you.',
    image: require('../../assets/onboarding/slide1.png'),
    accentColor: '#006B3F',
    gradient: ['#006B3F', '#004D2C'],
  },
  {
    id: 2,
    badge: 'INTERACTIVE READER',
    title: 'Read Every Law',
    subtitle: 'The Constitution and federal Acts, one section at a time — swipe to move.',
    image: require('../../assets/onboarding/slide2.png'),
    accentColor: '#0F766E',
    gradient: ['#0F766E', '#115E59'],
  },
  {
    id: 3,
    badge: 'INTELLIGENT CITATIONS',
    title: 'Ask Any Question',
    subtitle: 'Describe a situation and see what the law actually says, with exact citations.',
    image: require('../../assets/onboarding/slide3.png'),
    accentColor: '#006B3F',
    gradient: ['#047857', '#064E3B'],
  },
  {
    id: 4,
    badge: 'KNOW YOUR RIGHTS',
    title: 'Test Your Knowledge',
    subtitle: 'Trivia on every law — know your rights, know your law, and earn badges.',
    image: require('../../assets/onboarding/slide4.png'),
    accentColor: '#B45309',
    gradient: ['#B45309', '#78350F'],
  },
  {
    id: 5,
    badge: 'COMMUNITY & NOTES',
    title: 'Discuss & Share',
    subtitle: 'Start conversations, invite people, and save your personal notes securely.',
    image: require('../../assets/onboarding/slide5.png'),
    accentColor: '#006B3F',
    gradient: ['#006B3F', '#0F3B2E'],
  },
];
