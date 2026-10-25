const {
  bundleIdentifiers,
  readAppVariant,
} = require('./src/config/variants.cjs');

const variant = readAppVariant(process.env.APP_VARIANT);

const names = {
  local: 'Nigeria Law Local',
  preview: 'Nigeria Law Preview',
  production: 'Nigeria Constitution and Law',
};

/** @param {{ config: import('expo/config').ExpoConfig }} context */
module.exports = ({ config }) => ({
  ...config,
  name: names[variant],
  slug: 'nigeria-law',
  scheme: 'nigerialaw',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleIdentifiers[variant],
  },
  android: {
    package: bundleIdentifiers[variant],
    adaptiveIcon: {
      backgroundColor: '#F6F3EC',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-router',
      {
        headers: {
          'Cross-Origin-Embedder-Policy': 'credentialless',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    ],
    'expo-font',
    'expo-status-bar',
  ],
  extra: {
    appVariant: variant,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
